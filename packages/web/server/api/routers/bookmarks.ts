import { z } from "zod";
import { Context, authedProcedure, router } from "../trpc";
import {
  ZBookmark,
  ZBookmarkContent,
  zBareBookmarkSchema,
  zBookmarkSchema,
  zGetBookmarksRequestSchema,
  zGetBookmarksResponseSchema,
  zNewBookmarkRequestSchema,
  zUpdateBookmarksRequestSchema,
} from "@/lib/types/api/bookmarks";
import {
  bookmarkLinks,
  bookmarkTags,
  bookmarkTexts,
  bookmarks,
  tagsOnBookmarks,
} from "@hoarder/db/schema";
import { LinkCrawlerQueue } from "@hoarder/shared/queues";
import { TRPCError, experimental_trpcMiddleware } from "@trpc/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { ZBookmarkTags } from "@/lib/types/api/tags";

import { db as DONT_USE_db } from "@hoarder/db";

const ensureBookmarkOwnership = experimental_trpcMiddleware<{
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
    },
  });
  if (!x) {
    throw new Error();
  }
  return x;
}

function toZodSchema(
  bookmark: Awaited<ReturnType<typeof dummyDrizzleReturnType>>,
): ZBookmark {
  const { tagsOnBookmarks, link, text, ...rest } = bookmark;

  let content: ZBookmarkContent;
  if (link) {
    content = { type: "link", ...link };
  } else if (text) {
    content = { type: "text", text: text.text || "" };
  } else {
    throw new Error("Unknown content type");
  }

  return {
    tags: tagsOnBookmarks.map((t) => ({
      attachedBy: t.attachedBy,
      ...t.tag,
    })),
    content,
    ...rest,
  };
}

export const bookmarksAppRouter = router({
  createBookmark: authedProcedure
    .input(zNewBookmarkRequestSchema)
    .output(zBookmarkSchema)
    .mutation(async ({ input, ctx }) => {
      const bookmark = await ctx.db.transaction(
        async (tx): Promise<ZBookmark> => {
          const bookmark = (
            await tx
              .insert(bookmarks)
              .values({
                userId: ctx.user.id,
              })
              .returning()
          )[0];

          let content: ZBookmarkContent;

          switch (input.type) {
            case "link": {
              const link = (
                await tx
                  .insert(bookmarkLinks)
                  .values({
                    id: bookmark.id,
                    url: input.url,
                  })
                  .returning()
              )[0];
              content = {
                type: "link",
                ...link,
              };
              break;
            }
            case "text": {
              const text = (
                await tx
                  .insert(bookmarkTexts)
                  .values({ id: bookmark.id, text: input.text })
                  .returning()
              )[0];
              content = {
                type: "text",
                text: text.text || "",
              };
              break;
            }
          }

          return {
            tags: [] as ZBookmarkTags[],
            content,
            ...bookmark,
          };
        },
      );

      // Enqueue crawling request
      await LinkCrawlerQueue.add("crawl", {
        bookmarkId: bookmark.id,
      });

      return bookmark;
    }),

  updateBookmark: authedProcedure
    .input(zUpdateBookmarksRequestSchema)
    .output(zBareBookmarkSchema)
    .use(ensureBookmarkOwnership)
    .mutation(async ({ input, ctx }) => {
      const res = await ctx.db
        .update(bookmarks)
        .set({
          archived: input.archived,
          favourited: input.favourited,
        })
        .where(
          and(
            eq(bookmarks.userId, ctx.user.id),
            eq(bookmarks.id, input.bookmarkId),
          ),
        )
        .returning();
      if (res.length == 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bookmark not found",
        });
      }
      return res[0];
    }),

  updateBookmarkText: authedProcedure
    .input(
      z.object({
        bookmarkId: z.string(),
        text: z.string().max(2000),
      }),
    )
    .use(ensureBookmarkOwnership)
    .mutation(async ({ input, ctx }) => {
      const res = await ctx.db
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
    }),

  deleteBookmark: authedProcedure
    .input(z.object({ bookmarkId: z.string() }))
    .use(ensureBookmarkOwnership)
    .mutation(async ({ input, ctx }) => {
      await ctx.db
        .delete(bookmarks)
        .where(
          and(
            eq(bookmarks.userId, ctx.user.id),
            eq(bookmarks.id, input.bookmarkId),
          ),
        );
    }),
  recrawlBookmark: authedProcedure
    .input(z.object({ bookmarkId: z.string() }))
    .use(ensureBookmarkOwnership)
    .mutation(async ({ input }) => {
      await LinkCrawlerQueue.add("crawl", {
        bookmarkId: input.bookmarkId,
      });
    }),
  getBookmark: authedProcedure
    .input(
      z.object({
        bookmarkId: z.string(),
      }),
    )
    .output(zBookmarkSchema)
    .use(ensureBookmarkOwnership)
    .query(async ({ input, ctx }) => {
      const bookmark = await ctx.db.query.bookmarks.findFirst({
        where: and(
          eq(bookmarks.userId, ctx.user.id),
          eq(bookmarks.id, input.bookmarkId),
        ),
        with: {
          tagsOnBookmarks: {
            with: {
              tag: true,
            },
          },
          link: true,
          text: true,
        },
      });
      if (!bookmark) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bookmark not found",
        });
      }

      return toZodSchema(bookmark);
    }),
  getBookmarks: authedProcedure
    .input(zGetBookmarksRequestSchema)
    .output(zGetBookmarksResponseSchema)
    .query(async ({ input, ctx }) => {
      const results = await ctx.db.query.bookmarks.findMany({
        where: and(
          eq(bookmarks.userId, ctx.user.id),
          input.archived !== undefined
            ? eq(bookmarks.archived, input.archived)
            : undefined,
          input.favourited !== undefined
            ? eq(bookmarks.favourited, input.favourited)
            : undefined,
          input.ids ? inArray(bookmarks.id, input.ids) : undefined,
        ),
        orderBy: [desc(bookmarks.createdAt)],
        with: {
          tagsOnBookmarks: {
            with: {
              tag: true,
            },
          },
          link: true,
          text: true,
        },
      });

      return { bookmarks: results.map(toZodSchema) };
    }),

  updateTags: authedProcedure
    .input(
      z.object({
        bookmarkId: z.string(),
        attach: z.array(
          z.object({
            tagId: z.string().optional(), // If the tag already exists and we know its id
            tag: z.string(),
          }),
        ),
        // Detach by tag ids
        detach: z.array(z.object({ tagId: z.string() })),
      }),
    )
    .use(ensureBookmarkOwnership)
    .mutation(async ({ input, ctx }) => {
      await ctx.db.transaction(async (tx) => {
        // Detaches
        if (input.detach.length > 0) {
          await tx.delete(tagsOnBookmarks).where(
            and(
              eq(tagsOnBookmarks.bookmarkId, input.bookmarkId),
              inArray(
                tagsOnBookmarks.tagId,
                input.detach.map((t) => t.tagId),
              ),
            ),
          );
        }

        if (input.attach.length == 0) {
          return;
        }

        // New Tags
        const toBeCreatedTags = input.attach
          .filter((i) => i.tagId === undefined)
          .map((i) => ({
            name: i.tag,
            userId: ctx.user.id,
          }));

        if (toBeCreatedTags.length > 0) {
          await tx
            .insert(bookmarkTags)
            .values(toBeCreatedTags)
            .onConflictDoNothing()
            .returning();
        }

        const allIds = (
          await tx.query.bookmarkTags.findMany({
            where: and(
              eq(bookmarkTags.userId, ctx.user.id),
              inArray(
                bookmarkTags.name,
                input.attach.map((t) => t.tag),
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
              tagId: i as string,
              bookmarkId: input.bookmarkId,
              attachedBy: "human" as const,
              userId: ctx.user.id,
            })),
          )
          .onConflictDoNothing();
      });
    }),
});
