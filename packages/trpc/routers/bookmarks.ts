import { experimental_trpcMiddleware, TRPCError } from "@trpc/server";
import {
  and,
  asc,
  desc,
  eq,
  exists,
  gt,
  gte,
  inArray,
  lt,
  lte,
  or,
} from "drizzle-orm";
import invariant from "tiny-invariant";
import { z } from "zod";

import type {
  ZBookmark,
  ZBookmarkContent,
} from "@karakeep/shared/types/bookmarks";
import type { ZBookmarkTags } from "@karakeep/shared/types/tags";
import { db as DONT_USE_db } from "@karakeep/db";
import {
  assets,
  AssetTypes,
  bookmarkAssets,
  bookmarkLinks,
  bookmarks,
  bookmarksInLists,
  bookmarkTags,
  bookmarkTexts,
  customPrompts,
  rssFeedImportsTable,
  tagsOnBookmarks,
} from "@karakeep/db/schema";
import {
  deleteAsset,
  SUPPORTED_BOOKMARK_ASSET_TYPES,
} from "@karakeep/shared/assetdb";
import serverConfig from "@karakeep/shared/config";
import { InferenceClientFactory } from "@karakeep/shared/inference";
import { buildSummaryPrompt } from "@karakeep/shared/prompts";
import {
  AssetPreprocessingQueue,
  LinkCrawlerQueue,
  OpenAIQueue,
  triggerRuleEngineOnEvent,
  triggerSearchDeletion,
  triggerSearchReindex,
  triggerWebhook,
} from "@karakeep/shared/queues";
import { getSearchIdxClient } from "@karakeep/shared/search";
import { parseSearchQuery } from "@karakeep/shared/searchQueryParser";
import {
  BookmarkTypes,
  DEFAULT_NUM_BOOKMARKS_PER_PAGE,
  zBookmarkSchema,
  zGetBookmarksRequestSchema,
  zGetBookmarksResponseSchema,
  zManipulatedTagSchema,
  zNewBookmarkRequestSchema,
  zSearchBookmarksCursor,
  zSearchBookmarksRequestSchema,
  zUpdateBookmarksRequestSchema,
} from "@karakeep/shared/types/bookmarks";

import type { AuthedContext, Context } from "../index";
import { authedProcedure, router } from "../index";
import { mapDBAssetTypeToUserType } from "../lib/attachments";
import { getBookmarkIdsFromMatcher } from "../lib/search";
import { List } from "../models/lists";
import { ensureAssetOwnership } from "./assets";

export const ensureBookmarkOwnership = experimental_trpcMiddleware<{
  ctx: Context;
  input: { bookmarkId: string };
}>().create(async (opts) => {
  const bookmark = await opts.ctx.db.query.bookmarks.findFirst({
    where: eq(bookmarks.id, opts.input.bookmarkId),
    columns: {
      userId: true,
    },
  });
  if (!opts.ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "User is not authorized",
    });
  }
  if (!bookmark) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Bookmark not found",
    });
  }
  if (bookmark.userId != opts.ctx.user.id) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "User is not allowed to access resource",
    });
  }

  return opts.next();
});

async function getBookmark(
  ctx: AuthedContext,
  bookmarkId: string,
  includeContent: boolean,
) {
  const bookmark = await ctx.db.query.bookmarks.findFirst({
    where: and(eq(bookmarks.userId, ctx.user.id), eq(bookmarks.id, bookmarkId)),
    with: {
      tagsOnBookmarks: {
        with: {
          tag: true,
        },
      },
      link: true,
      text: true,
      asset: true,
      assets: true,
    },
  });
  if (!bookmark) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Bookmark not found",
    });
  }

  return toZodSchema(bookmark, includeContent);
}

async function attemptToDedupLink(ctx: AuthedContext, url: string) {
  const result = await ctx.db
    .select({
      id: bookmarkLinks.id,
    })
    .from(bookmarkLinks)
    .leftJoin(bookmarks, eq(bookmarks.id, bookmarkLinks.id))
    .where(and(eq(bookmarkLinks.url, url), eq(bookmarks.userId, ctx.user.id)));

  if (result.length == 0) {
    return null;
  }
  return getBookmark(ctx, result[0].id, /* includeContent: */ false);
}

async function dummyDrizzleReturnType() {
  const x = await DONT_USE_db.query.bookmarks.findFirst({
    with: {
      tagsOnBookmarks: {
        with: {
          tag: true,
        },
      },
      link: true,
      text: true,
      asset: true,
      assets: true,
    },
  });
  if (!x) {
    throw new Error();
  }
  return x;
}

type BookmarkQueryReturnType = Awaited<
  ReturnType<typeof dummyDrizzleReturnType>
>;

async function cleanupAssetForBookmark(
  bookmark: Pick<BookmarkQueryReturnType, "asset" | "userId" | "assets">,
) {
  const assetIds: Set<string> = new Set<string>(
    bookmark.assets.map((a) => a.id),
  );
  // Todo: Remove when the bookmark asset is also in the assets table
  if (bookmark.asset) {
    assetIds.add(bookmark.asset.assetId);
  }
  await Promise.all(
    Array.from(assetIds).map((assetId) =>
      deleteAsset({ userId: bookmark.userId, assetId }),
    ),
  );
}

function toZodSchema(
  bookmark: BookmarkQueryReturnType,
  includeContent: boolean,
): ZBookmark {
  const { tagsOnBookmarks, link, text, asset, assets, ...rest } = bookmark;

  let content: ZBookmarkContent = {
    type: BookmarkTypes.UNKNOWN,
  };
  if (bookmark.link) {
    content = {
      type: BookmarkTypes.LINK,
      screenshotAssetId: assets.find(
        (a) => a.assetType == AssetTypes.LINK_SCREENSHOT,
      )?.id,
      fullPageArchiveAssetId: assets.find(
        (a) => a.assetType == AssetTypes.LINK_FULL_PAGE_ARCHIVE,
      )?.id,
      precrawledArchiveAssetId: assets.find(
        (a) => a.assetType == AssetTypes.LINK_PRECRAWLED_ARCHIVE,
      )?.id,
      imageAssetId: assets.find(
        (a) => a.assetType == AssetTypes.LINK_BANNER_IMAGE,
      )?.id,
      videoAssetId: assets.find((a) => a.assetType == AssetTypes.LINK_VIDEO)
        ?.id,
      url: link.url,
      title: link.title,
      description: link.description,
      imageUrl: link.imageUrl,
      favicon: link.favicon,
      htmlContent: includeContent ? link.htmlContent : null,
      crawledAt: link.crawledAt,
      author: link.author,
      publisher: link.publisher,
      datePublished: link.datePublished,
      dateModified: link.dateModified,
    };
  }
  if (bookmark.text) {
    content = {
      type: BookmarkTypes.TEXT,
      // It's ok to include the text content as it's usually not big and is used to render the text bookmark card.
      text: text.text ?? "",
      sourceUrl: text.sourceUrl,
    };
  }
  if (bookmark.asset) {
    content = {
      type: BookmarkTypes.ASSET,
      assetType: asset.assetType,
      assetId: asset.assetId,
      fileName: asset.fileName,
      sourceUrl: asset.sourceUrl,
      size: assets.find((a) => a.id == asset.assetId)?.size,
      content: includeContent ? asset.content : null,
    };
  }

  return {
    tags: tagsOnBookmarks.map((t) => ({
      attachedBy: t.attachedBy,
      ...t.tag,
    })),
    content,
    assets: assets.map((a) => ({
      id: a.id,
      assetType: mapDBAssetTypeToUserType(a.assetType),
    })),
    ...rest,
  };
}

export const bookmarksAppRouter = router({
  createBookmark: authedProcedure
    .input(zNewBookmarkRequestSchema)
    .output(
      zBookmarkSchema.merge(
        z.object({
          alreadyExists: z.boolean().optional().default(false),
        }),
      ),
    )
    .mutation(async ({ input, ctx }) => {
      if (input.type == BookmarkTypes.LINK) {
        // This doesn't 100% protect from duplicates because of races, but it's more than enough for this usecase.
        const alreadyExists = await attemptToDedupLink(ctx, input.url);
        if (alreadyExists) {
          return { ...alreadyExists, alreadyExists: true };
        }
      }
      const bookmark = await ctx.db.transaction(async (tx) => {
        const bookmark = (
          await tx
            .insert(bookmarks)
            .values({
              userId: ctx.user.id,
              title: input.title,
              type: input.type,
              archived: input.archived,
              favourited: input.favourited,
              note: input.note,
              summary: input.summary,
              createdAt: input.createdAt,
            })
            .returning()
        )[0];

        let content: ZBookmarkContent;

        switch (input.type) {
          case BookmarkTypes.LINK: {
            const link = (
              await tx
                .insert(bookmarkLinks)
                .values({
                  id: bookmark.id,
                  url: input.url.trim(),
                })
                .returning()
            )[0];
            if (input.precrawledArchiveId) {
              await ensureAssetOwnership({
                ctx,
                assetId: input.precrawledArchiveId,
              });
              await tx
                .update(assets)
                .set({
                  bookmarkId: bookmark.id,
                  assetType: AssetTypes.LINK_PRECRAWLED_ARCHIVE,
                })
                .where(
                  and(
                    eq(assets.id, input.precrawledArchiveId),
                    eq(assets.userId, ctx.user.id),
                  ),
                );
            }
            content = {
              type: BookmarkTypes.LINK,
              ...link,
            };
            break;
          }
          case BookmarkTypes.TEXT: {
            const text = (
              await tx
                .insert(bookmarkTexts)
                .values({
                  id: bookmark.id,
                  text: input.text,
                  sourceUrl: input.sourceUrl,
                })
                .returning()
            )[0];
            content = {
              type: BookmarkTypes.TEXT,
              text: text.text ?? "",
              sourceUrl: text.sourceUrl,
            };
            break;
          }
          case BookmarkTypes.ASSET: {
            const [asset] = await tx
              .insert(bookmarkAssets)
              .values({
                id: bookmark.id,
                assetType: input.assetType,
                assetId: input.assetId,
                content: null,
                metadata: null,
                fileName: input.fileName ?? null,
                sourceUrl: null,
              })
              .returning();
            const uploadedAsset = await ensureAssetOwnership({
              ctx,
              assetId: input.assetId,
            });
            if (
              !uploadedAsset.contentType ||
              !SUPPORTED_BOOKMARK_ASSET_TYPES.has(uploadedAsset.contentType)
            ) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Unsupported asset type",
              });
            }
            await tx
              .update(assets)
              .set({
                bookmarkId: bookmark.id,
                assetType: AssetTypes.BOOKMARK_ASSET,
              })
              .where(
                and(
                  eq(assets.id, input.assetId),
                  eq(assets.userId, ctx.user.id),
                ),
              );
            content = {
              type: BookmarkTypes.ASSET,
              assetType: asset.assetType,
              assetId: asset.assetId,
            };
            break;
          }
        }

        return {
          alreadyExists: false,
          tags: [] as ZBookmarkTags[],
          assets: [],
          content,
          ...bookmark,
        };
      });

      // Enqueue crawling request
      switch (bookmark.content.type) {
        case BookmarkTypes.LINK: {
          // The crawling job triggers openai when it's done
          await LinkCrawlerQueue.enqueue({
            bookmarkId: bookmark.id,
          });
          break;
        }
        case BookmarkTypes.TEXT: {
          await OpenAIQueue.enqueue({
            bookmarkId: bookmark.id,
            type: "tag",
          });
          break;
        }
        case BookmarkTypes.ASSET: {
          await AssetPreprocessingQueue.enqueue({
            bookmarkId: bookmark.id,
            fixMode: false,
          });
          break;
        }
      }
      await triggerRuleEngineOnEvent(bookmark.id, [
        {
          type: "bookmarkAdded",
        },
      ]);
      await triggerSearchReindex(bookmark.id);
      await triggerWebhook(bookmark.id, "created");
      return bookmark;
    }),

  updateBookmark: authedProcedure
    .input(zUpdateBookmarksRequestSchema)
    .output(zBookmarkSchema)
    .use(ensureBookmarkOwnership)
    .mutation(async ({ input, ctx }) => {
      await ctx.db.transaction(async (tx) => {
        let somethingChanged = false;

        // Update link-specific fields if any are provided
        const linkUpdateData: Partial<{
          url: string;
          description: string | null;
          author: string | null;
          publisher: string | null;
          datePublished: Date | null;
          dateModified: Date | null;
        }> = {};
        if (input.url) {
          linkUpdateData.url = input.url.trim();
        }
        if (input.description !== undefined) {
          linkUpdateData.description = input.description;
        }
        if (input.author !== undefined) {
          linkUpdateData.author = input.author;
        }
        if (input.publisher !== undefined) {
          linkUpdateData.publisher = input.publisher;
        }
        if (input.datePublished !== undefined) {
          linkUpdateData.datePublished = input.datePublished;
        }
        if (input.dateModified !== undefined) {
          linkUpdateData.dateModified = input.dateModified;
        }

        if (Object.keys(linkUpdateData).length > 0) {
          const result = await tx
            .update(bookmarkLinks)
            .set(linkUpdateData)
            .where(eq(bookmarkLinks.id, input.bookmarkId));
          if (result.changes == 0) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                "Attempting to set link attributes for non-link type bookmark",
            });
          }
          somethingChanged = true;
        }

        if (input.text) {
          const result = await tx
            .update(bookmarkTexts)
            .set({
              text: input.text,
            })
            .where(eq(bookmarkTexts.id, input.bookmarkId));

          if (result.changes == 0) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                "Attempting to set link attributes for non-text type bookmark",
            });
          }
          somethingChanged = true;
        }

        if (input.assetContent !== undefined) {
          const result = await tx
            .update(bookmarkAssets)
            .set({
              content: input.assetContent,
            })
            .where(and(eq(bookmarkAssets.id, input.bookmarkId)));

          if (result.changes == 0) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                "Attempting to set asset content for non-asset type bookmark",
            });
          }
          somethingChanged = true;
        }

        // Update common bookmark fields
        const commonUpdateData: Partial<{
          title: string | null;
          archived: boolean;
          favourited: boolean;
          note: string | null;
          summary: string | null;
          createdAt: Date;
          modifiedAt: Date; // Always update modifiedAt
        }> = {
          modifiedAt: new Date(),
        };
        if (input.title !== undefined) {
          commonUpdateData.title = input.title;
        }
        if (input.archived !== undefined) {
          commonUpdateData.archived = input.archived;
        }
        if (input.favourited !== undefined) {
          commonUpdateData.favourited = input.favourited;
        }
        if (input.note !== undefined) {
          commonUpdateData.note = input.note;
        }
        if (input.summary !== undefined) {
          commonUpdateData.summary = input.summary;
        }
        if (input.createdAt !== undefined) {
          commonUpdateData.createdAt = input.createdAt;
        }

        if (Object.keys(commonUpdateData).length > 1 || somethingChanged) {
          await tx
            .update(bookmarks)
            .set(commonUpdateData)
            .where(
              and(
                eq(bookmarks.userId, ctx.user.id),
                eq(bookmarks.id, input.bookmarkId),
              ),
            );
        }
      });

      // Refetch the updated bookmark data to return the full object
      const updatedBookmark = await getBookmark(
        ctx,
        input.bookmarkId,
        /* includeContent: */ false,
      );

      if (input.favourited === true || input.archived === true) {
        await triggerRuleEngineOnEvent(
          input.bookmarkId,
          [
            ...(input.favourited === true ? ["favourited" as const] : []),
            ...(input.archived === true ? ["archived" as const] : []),
          ].map((t) => ({
            type: t,
          })),
        );
      }
      // Trigger re-indexing and webhooks
      await triggerSearchReindex(input.bookmarkId);
      await triggerWebhook(input.bookmarkId, "edited");

      return updatedBookmark;
    }),

  // DEPRECATED: use updateBookmark instead
  updateBookmarkText: authedProcedure
    .input(
      z.object({
        bookmarkId: z.string(),
        text: z.string(),
      }),
    )
    .use(ensureBookmarkOwnership)
    .mutation(async ({ input, ctx }) => {
      await ctx.db.transaction(async (tx) => {
        const res = await tx
          .update(bookmarkTexts)
          .set({
            text: input.text,
          })
          .where(and(eq(bookmarkTexts.id, input.bookmarkId)))
          .returning();
        if (res.length == 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Bookmark not found",
          });
        }
        await tx
          .update(bookmarks)
          .set({ modifiedAt: new Date() })
          .where(
            and(
              eq(bookmarks.id, input.bookmarkId),
              eq(bookmarks.userId, ctx.user.id),
            ),
          );
      });
      await triggerSearchReindex(input.bookmarkId);
      await triggerWebhook(input.bookmarkId, "edited");
    }),

  deleteBookmark: authedProcedure
    .input(z.object({ bookmarkId: z.string() }))
    .use(ensureBookmarkOwnership)
    .mutation(async ({ input, ctx }) => {
      const bookmark = await ctx.db.query.bookmarks.findFirst({
        where: and(
          eq(bookmarks.id, input.bookmarkId),
          eq(bookmarks.userId, ctx.user.id),
        ),
        with: {
          asset: true,
          link: true,
          assets: true,
        },
      });
      const deleted = await ctx.db
        .delete(bookmarks)
        .where(
          and(
            eq(bookmarks.userId, ctx.user.id),
            eq(bookmarks.id, input.bookmarkId),
          ),
        );
      await triggerSearchDeletion(input.bookmarkId);
      await triggerWebhook(input.bookmarkId, "deleted");
      if (deleted.changes > 0 && bookmark) {
        await cleanupAssetForBookmark({
          asset: bookmark.asset,
          userId: ctx.user.id,
          assets: bookmark.assets,
        });
      }
    }),
  recrawlBookmark: authedProcedure
    .input(
      z.object({
        bookmarkId: z.string(),
        archiveFullPage: z.boolean().optional().default(false),
      }),
    )
    .use(ensureBookmarkOwnership)
    .mutation(async ({ input, ctx }) => {
      await ctx.db
        .update(bookmarkLinks)
        .set({
          crawlStatus: "pending",
          crawlStatusCode: null,
        })
        .where(eq(bookmarkLinks.id, input.bookmarkId));
      await LinkCrawlerQueue.enqueue({
        bookmarkId: input.bookmarkId,
        archiveFullPage: input.archiveFullPage,
      });
    }),
  getBookmark: authedProcedure
    .input(
      z.object({
        bookmarkId: z.string(),
        includeContent: z.boolean().optional().default(false),
      }),
    )
    .output(zBookmarkSchema)
    .use(ensureBookmarkOwnership)
    .query(async ({ input, ctx }) => {
      return await getBookmark(ctx, input.bookmarkId, input.includeContent);
    }),
  searchBookmarks: authedProcedure
    .input(zSearchBookmarksRequestSchema)
    .output(
      z.object({
        bookmarks: z.array(zBookmarkSchema),
        nextCursor: zSearchBookmarksCursor.nullable(),
      }),
    )
    .query(async ({ input, ctx }) => {
      if (!input.limit) {
        input.limit = DEFAULT_NUM_BOOKMARKS_PER_PAGE;
      }
      const sortOrder = input.sortOrder || "relevance";
      const client = await getSearchIdxClient();
      if (!client) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Search functionality is not configured",
        });
      }
      const parsedQuery = parseSearchQuery(input.text);

      let filter: string[];
      if (parsedQuery.matcher) {
        const bookmarkIds = await getBookmarkIdsFromMatcher(
          ctx,
          parsedQuery.matcher,
        );
        filter = [
          `userId = '${ctx.user.id}' AND id IN [${bookmarkIds.join(",")}]`,
        ];
      } else {
        filter = [`userId = '${ctx.user.id}'`];
      }

      /**
       * preserve legacy behaviour
       */
      const createdAtSortOrder = sortOrder === "relevance" ? "desc" : sortOrder;

      const resp = await client.search(parsedQuery.text, {
        filter,
        showRankingScore: true,
        attributesToRetrieve: ["id"],
        sort: [`createdAt:${createdAtSortOrder}`],
        limit: input.limit,
        ...(input.cursor
          ? {
              offset: input.cursor.offset,
            }
          : {}),
      });

      if (resp.hits.length == 0) {
        return { bookmarks: [], nextCursor: null };
      }
      const idToRank = resp.hits.reduce<Record<string, number>>((acc, r) => {
        acc[r.id] = r._rankingScore!;
        return acc;
      }, {});
      const results = await ctx.db.query.bookmarks.findMany({
        where: and(
          eq(bookmarks.userId, ctx.user.id),
          inArray(
            bookmarks.id,
            resp.hits.map((h) => h.id),
          ),
        ),
        with: {
          tagsOnBookmarks: {
            with: {
              tag: true,
            },
          },
          link: true,
          text: true,
          asset: true,
          assets: true,
        },
      });

      switch (true) {
        case sortOrder === "relevance":
          results.sort((a, b) => idToRank[b.id] - idToRank[a.id]);
          break;
        case sortOrder === "desc":
          results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          break;
        case sortOrder === "asc":
          results.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
          break;
      }

      return {
        bookmarks: results.map((b) => toZodSchema(b, input.includeContent)),
        nextCursor:
          resp.hits.length + resp.offset >= resp.estimatedTotalHits
            ? null
            : {
                ver: 1 as const,
                offset: resp.hits.length + resp.offset,
              },
      };
    }),
  getBookmarks: authedProcedure
    .input(zGetBookmarksRequestSchema)
    .output(zGetBookmarksResponseSchema)
    .query(async ({ input, ctx }) => {
      if (input.ids && input.ids.length == 0) {
        return { bookmarks: [], nextCursor: null };
      }
      if (!input.limit) {
        input.limit = DEFAULT_NUM_BOOKMARKS_PER_PAGE;
      }
      if (input.listId) {
        const list = await List.fromId(ctx, input.listId);
        if (list.type === "smart") {
          input.ids = await list.getBookmarkIds();
          delete input.listId;
        }
      }

      const sq = ctx.db.$with("bookmarksSq").as(
        ctx.db
          .select()
          .from(bookmarks)
          .where(
            and(
              eq(bookmarks.userId, ctx.user.id),
              input.archived !== undefined
                ? eq(bookmarks.archived, input.archived)
                : undefined,
              input.favourited !== undefined
                ? eq(bookmarks.favourited, input.favourited)
                : undefined,
              input.ids ? inArray(bookmarks.id, input.ids) : undefined,
              input.tagId !== undefined
                ? exists(
                    ctx.db
                      .select()
                      .from(tagsOnBookmarks)
                      .where(
                        and(
                          eq(tagsOnBookmarks.bookmarkId, bookmarks.id),
                          eq(tagsOnBookmarks.tagId, input.tagId),
                        ),
                      ),
                  )
                : undefined,
              input.rssFeedId !== undefined
                ? exists(
                    ctx.db
                      .select()
                      .from(rssFeedImportsTable)
                      .where(
                        and(
                          eq(rssFeedImportsTable.bookmarkId, bookmarks.id),
                          eq(rssFeedImportsTable.rssFeedId, input.rssFeedId),
                        ),
                      ),
                  )
                : undefined,
              input.listId !== undefined
                ? exists(
                    ctx.db
                      .select()
                      .from(bookmarksInLists)
                      .where(
                        and(
                          eq(bookmarksInLists.bookmarkId, bookmarks.id),
                          eq(bookmarksInLists.listId, input.listId),
                        ),
                      ),
                  )
                : undefined,
              input.cursor
                ? input.sortOrder === "asc"
                  ? or(
                      gt(bookmarks.createdAt, input.cursor.createdAt),
                      and(
                        eq(bookmarks.createdAt, input.cursor.createdAt),
                        gte(bookmarks.id, input.cursor.id),
                      ),
                    )
                  : or(
                      lt(bookmarks.createdAt, input.cursor.createdAt),
                      and(
                        eq(bookmarks.createdAt, input.cursor.createdAt),
                        lte(bookmarks.id, input.cursor.id),
                      ),
                    )
                : undefined,
            ),
          )
          .limit(input.limit + 1)
          .orderBy(
            input.sortOrder === "asc"
              ? asc(bookmarks.createdAt)
              : desc(bookmarks.createdAt),
            desc(bookmarks.id),
          ),
      );
      // TODO: Consider not inlining the tags in the response of getBookmarks as this query is getting kinda expensive
      const results = await ctx.db
        .with(sq)
        .select()
        .from(sq)
        .leftJoin(tagsOnBookmarks, eq(sq.id, tagsOnBookmarks.bookmarkId))
        .leftJoin(bookmarkTags, eq(tagsOnBookmarks.tagId, bookmarkTags.id))
        .leftJoin(bookmarkLinks, eq(bookmarkLinks.id, sq.id))
        .leftJoin(bookmarkTexts, eq(bookmarkTexts.id, sq.id))
        .leftJoin(bookmarkAssets, eq(bookmarkAssets.id, sq.id))
        .leftJoin(assets, eq(assets.bookmarkId, sq.id))
        .orderBy(desc(sq.createdAt), desc(sq.id));

      const bookmarksRes = results.reduce<Record<string, ZBookmark>>(
        (acc, row) => {
          const bookmarkId = row.bookmarksSq.id;
          if (!acc[bookmarkId]) {
            let content: ZBookmarkContent;
            if (row.bookmarkLinks) {
              content = {
                type: BookmarkTypes.LINK,
                url: row.bookmarkLinks.url,
                title: row.bookmarkLinks.title,
                description: row.bookmarkLinks.description,
                imageUrl: row.bookmarkLinks.imageUrl,
                favicon: row.bookmarkLinks.favicon,
                htmlContent: input.includeContent
                  ? row.bookmarkLinks.htmlContent
                  : null,
                crawledAt: row.bookmarkLinks.crawledAt,
                author: row.bookmarkLinks.author,
                publisher: row.bookmarkLinks.publisher,
                datePublished: row.bookmarkLinks.datePublished,
                dateModified: row.bookmarkLinks.dateModified,
              };
            } else if (row.bookmarkTexts) {
              content = {
                type: BookmarkTypes.TEXT,
                text: row.bookmarkTexts.text ?? "",
                sourceUrl: row.bookmarkTexts.sourceUrl ?? null,
              };
            } else if (row.bookmarkAssets) {
              content = {
                type: BookmarkTypes.ASSET,
                assetId: row.bookmarkAssets.assetId,
                assetType: row.bookmarkAssets.assetType,
                fileName: row.bookmarkAssets.fileName,
                sourceUrl: row.bookmarkAssets.sourceUrl ?? null,
                size: null, // This will get filled in the asset loop
                content: input.includeContent
                  ? (row.bookmarkAssets.content ?? null)
                  : null,
              };
            } else {
              content = {
                type: BookmarkTypes.UNKNOWN,
              };
            }
            acc[bookmarkId] = {
              ...row.bookmarksSq,
              content,
              tags: [],
              assets: [],
            };
          }

          if (
            row.bookmarkTags &&
            // Duplicates may occur because of the join, so we need to make sure we're not adding the same tag twice
            !acc[bookmarkId].tags.some((t) => t.id == row.bookmarkTags!.id)
          ) {
            invariant(
              row.tagsOnBookmarks,
              "if bookmark tag is set, its many-to-many relation must also be set",
            );
            acc[bookmarkId].tags.push({
              ...row.bookmarkTags,
              attachedBy: row.tagsOnBookmarks.attachedBy,
            });
          }

          if (
            row.assets &&
            !acc[bookmarkId].assets.some((a) => a.id == row.assets!.id)
          ) {
            if (acc[bookmarkId].content.type == BookmarkTypes.LINK) {
              const content = acc[bookmarkId].content;
              invariant(content.type == BookmarkTypes.LINK);
              if (row.assets.assetType == AssetTypes.LINK_SCREENSHOT) {
                content.screenshotAssetId = row.assets.id;
              }
              if (row.assets.assetType == AssetTypes.LINK_FULL_PAGE_ARCHIVE) {
                content.fullPageArchiveAssetId = row.assets.id;
              }
              if (row.assets.assetType == AssetTypes.LINK_BANNER_IMAGE) {
                content.imageAssetId = row.assets.id;
              }
              if (row.assets.assetType == AssetTypes.LINK_VIDEO) {
                content.videoAssetId = row.assets.id;
              }
              if (row.assets.assetType == AssetTypes.LINK_PRECRAWLED_ARCHIVE) {
                content.precrawledArchiveAssetId = row.assets.id;
              }
              acc[bookmarkId].content = content;
            }
            if (acc[bookmarkId].content.type == BookmarkTypes.ASSET) {
              const content = acc[bookmarkId].content;
              if (row.assets.id == content.assetId) {
                // If this is the bookmark's main aset, caputure its size.
                content.size = row.assets.size;
              }
            }
            acc[bookmarkId].assets.push({
              id: row.assets.id,
              assetType: mapDBAssetTypeToUserType(row.assets.assetType),
            });
          }

          return acc;
        },
        {},
      );

      const bookmarksArr = Object.values(bookmarksRes);

      bookmarksArr.sort((a, b) => {
        if (a.createdAt != b.createdAt) {
          return input.sortOrder === "asc"
            ? a.createdAt.getTime() - b.createdAt.getTime()
            : b.createdAt.getTime() - a.createdAt.getTime();
        } else {
          return b.id.localeCompare(a.id);
        }
      });

      let nextCursor = null;
      if (bookmarksArr.length > input.limit) {
        const nextItem = bookmarksArr.pop()!;
        nextCursor = {
          id: nextItem.id,
          createdAt: nextItem.createdAt,
        };
      }

      return { bookmarks: bookmarksArr, nextCursor };
    }),

  updateTags: authedProcedure
    .input(
      z.object({
        bookmarkId: z.string(),
        attach: z.array(zManipulatedTagSchema),
        detach: z.array(zManipulatedTagSchema),
      }),
    )
    .output(
      z.object({
        attached: z.array(z.string()),
        detached: z.array(z.string()),
      }),
    )
    .use(ensureBookmarkOwnership)
    .mutation(async ({ input, ctx }) => {
      return ctx.db.transaction(async (tx) => {
        // Detaches
        const idsToRemove: string[] = [];
        if (input.detach.length > 0) {
          const namesToRemove: string[] = [];
          input.detach.forEach((detachInfo) => {
            if (detachInfo.tagId) {
              idsToRemove.push(detachInfo.tagId);
            }
            if (detachInfo.tagName) {
              namesToRemove.push(detachInfo.tagName);
            }
          });

          if (namesToRemove.length > 0) {
            (
              await tx.query.bookmarkTags.findMany({
                where: and(
                  eq(bookmarkTags.userId, ctx.user.id),
                  inArray(bookmarkTags.name, namesToRemove),
                ),
                columns: {
                  id: true,
                },
              })
            ).forEach((tag) => {
              idsToRemove.push(tag.id);
            });
          }

          await tx
            .delete(tagsOnBookmarks)
            .where(
              and(
                eq(tagsOnBookmarks.bookmarkId, input.bookmarkId),
                inArray(tagsOnBookmarks.tagId, idsToRemove),
              ),
            );
        }

        if (input.attach.length == 0) {
          return {
            bookmarkId: input.bookmarkId,
            attached: [],
            detached: idsToRemove,
          };
        }

        const toAddTagNames = input.attach.flatMap((i) =>
          i.tagName ? [i.tagName] : [],
        );
        const toAddTagIds = input.attach.flatMap((i) =>
          i.tagId ? [i.tagId] : [],
        );

        // New Tags
        if (toAddTagNames.length > 0) {
          await tx
            .insert(bookmarkTags)
            .values(
              toAddTagNames.map((name) => ({ name, userId: ctx.user.id })),
            )
            .onConflictDoNothing()
            .returning();
        }

        // If there is nothing to add, the "or" statement will become useless and
        // the query below will simply select all the existing tags for this user and assign them to the bookmark
        invariant(toAddTagNames.length > 0 || toAddTagIds.length > 0);
        const allIds = (
          await tx.query.bookmarkTags.findMany({
            where: and(
              eq(bookmarkTags.userId, ctx.user.id),
              or(
                toAddTagIds.length > 0
                  ? inArray(bookmarkTags.id, toAddTagIds)
                  : undefined,
                toAddTagNames.length > 0
                  ? inArray(bookmarkTags.name, toAddTagNames)
                  : undefined,
              ),
            ),
            columns: {
              id: true,
            },
          })
        ).map((t) => t.id);

        await tx
          .insert(tagsOnBookmarks)
          .values(
            allIds.map((i) => ({
              tagId: i,
              bookmarkId: input.bookmarkId,
              attachedBy: "human" as const,
              userId: ctx.user.id,
            })),
          )
          .onConflictDoNothing();
        await tx
          .update(bookmarks)
          .set({ modifiedAt: new Date() })
          .where(
            and(
              eq(bookmarks.id, input.bookmarkId),
              eq(bookmarks.userId, ctx.user.id),
            ),
          );

        await triggerRuleEngineOnEvent(input.bookmarkId, [
          ...idsToRemove.map((t) => ({
            type: "tagRemoved" as const,
            tagId: t,
          })),
          ...allIds.map((t) => ({
            type: "tagAdded" as const,
            tagId: t,
          })),
        ]);
        await triggerSearchReindex(input.bookmarkId);
        await triggerWebhook(input.bookmarkId, "edited");
        return {
          bookmarkId: input.bookmarkId,
          attached: allIds,
          detached: idsToRemove,
        };
      });
    }),
  getBrokenLinks: authedProcedure
    .output(
      z.object({
        bookmarks: z.array(
          z.object({
            id: z.string(),
            url: z.string(),
            statusCode: z.number().nullable(),
            isCrawlingFailure: z.boolean(),
            crawledAt: z.date().nullable(),
            createdAt: z.date().nullable(),
          }),
        ),
      }),
    )
    .query(async ({ ctx }) => {
      const brokenLinkBookmarks = await ctx.db
        .select({
          id: bookmarkLinks.id,
          url: bookmarkLinks.url,
          crawlStatusCode: bookmarkLinks.crawlStatusCode,
          crawlingStatus: bookmarkLinks.crawlStatus,
          crawledAt: bookmarkLinks.crawledAt,
          createdAt: bookmarks.createdAt,
        })
        .from(bookmarkLinks)
        .leftJoin(bookmarks, eq(bookmarks.id, bookmarkLinks.id))
        .where(
          and(
            eq(bookmarks.userId, ctx.user.id),
            or(
              eq(bookmarkLinks.crawlStatus, "failure"),
              lt(bookmarkLinks.crawlStatusCode, 200),
              gt(bookmarkLinks.crawlStatusCode, 299),
            ),
          ),
        );
      return {
        bookmarks: brokenLinkBookmarks.map((b) => ({
          id: b.id,
          url: b.url,
          statusCode: b.crawlStatusCode,
          isCrawlingFailure: b.crawlingStatus === "failure",
          crawledAt: b.crawledAt,
          createdAt: b.createdAt,
        })),
      };
    }),
  summarizeBookmark: authedProcedure
    .input(
      z.object({
        bookmarkId: z.string(),
      }),
    )
    .output(
      z.object({
        summary: z.string(),
      }),
    )
    .use(ensureBookmarkOwnership)
    .mutation(async ({ input, ctx }) => {
      const inferenceClient = InferenceClientFactory.build();
      if (!inferenceClient) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No inference client configured",
        });
      }
      const bookmark = await ctx.db.query.bookmarkLinks.findFirst({
        where: eq(bookmarkLinks.id, input.bookmarkId),
      });

      if (!bookmark) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bookmark not found or not a link",
        });
      }

      const bookmarkDetails = `
Title: ${bookmark.title ?? ""}
Description: ${bookmark.description ?? ""}
Content: ${bookmark.content ?? ""}
Publisher: ${bookmark.publisher ?? ""}
Author: ${bookmark.author ?? ""}
`;

      const prompts = await ctx.db.query.customPrompts.findMany({
        where: and(
          eq(customPrompts.userId, ctx.user.id),
          eq(customPrompts.appliesTo, "summary"),
        ),
        columns: {
          text: true,
        },
      });

      const summaryPrompt = buildSummaryPrompt(
        serverConfig.inference.inferredTagLang,
        prompts.map((p) => p.text),
        bookmarkDetails,
        serverConfig.inference.contextLength,
      );

      const summary = await inferenceClient.inferFromText(summaryPrompt, {
        schema: null,
      });

      if (!summary.response) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to summarize bookmark",
        });
      }
      await ctx.db
        .update(bookmarks)
        .set({
          summary: summary.response,
        })
        .where(eq(bookmarks.id, input.bookmarkId));
      await triggerSearchReindex(input.bookmarkId);
      await triggerWebhook(input.bookmarkId, "edited");

      return {
        bookmarkId: input.bookmarkId,
        summary: summary.response,
      };
    }),
});
