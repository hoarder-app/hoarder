import { z } from "zod";
import { authedProcedure, router } from "../trpc";
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
import { db } from "@hoarder/db";
import { bookmarkLinks, bookmarks } from "@hoarder/db/schema";
import { LinkCrawlerQueue } from "@hoarder/shared/queues";
import { TRPCError, experimental_trpcMiddleware } from "@trpc/server";
import { User } from "next-auth";
import { and, desc, eq, inArray } from "drizzle-orm";
import { ZBookmarkTags } from "@/lib/types/api/tags";

const ensureBookmarkOwnership = experimental_trpcMiddleware<{
  ctx: { user: User };
  input: { bookmarkId: string };
}>().create(async (opts) => {
  const bookmark = await db.query.bookmarks.findFirst({
    where: eq(bookmarks.id, opts.input.bookmarkId),
    columns: {
      userId: true,
    },
  });
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
  const x = await db.query.bookmarks.findFirst({
    with: {
      tagsOnBookmarks: {
        with: {
          tag: true,
        },
      },
      link: true,
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
  const { tagsOnBookmarks, link, ...rest } = bookmark;

  let content: ZBookmarkContent;
  if (link) {
    content = { type: "link", ...link };
  } else {
    throw new Error("Unknown content type");
  }

  return {
    tags: tagsOnBookmarks.map((t) => t.tag),
    content,
    ...rest,
  };
}

export const bookmarksAppRouter = router({
  bookmarkLink: authedProcedure
    .input(zNewBookmarkRequestSchema)
    .output(zBookmarkSchema)
    .mutation(async ({ input, ctx }) => {
      const { url } = input;

      const bookmark = await db.transaction(async (tx): Promise<ZBookmark> => {
        const bookmark = (
          await tx
            .insert(bookmarks)
            .values({
              userId: ctx.user.id,
            })
            .returning()
        )[0];

        const link = (
          await tx
            .insert(bookmarkLinks)
            .values({
              id: bookmark.id,
              url,
            })
            .returning()
        )[0];

        const content: ZBookmarkContent = {
          type: "link",
          ...link,
        };

        return {
          tags: [] as ZBookmarkTags[],
          content,
          ...bookmark,
        };
      });

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
      const res = await db
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

  deleteBookmark: authedProcedure
    .input(z.object({ bookmarkId: z.string() }))
    .use(ensureBookmarkOwnership)
    .mutation(async ({ input, ctx }) => {
      await db
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
        id: z.string(),
      }),
    )
    .output(zBookmarkSchema)
    .query(async ({ input, ctx }) => {
      const bookmark = await db.query.bookmarks.findFirst({
        where: and(
          eq(bookmarks.userId, ctx.user.id),
          eq(bookmarks.id, input.id),
        ),
        with: {
          tagsOnBookmarks: {
            with: {
              tag: true,
            },
          },
          link: true,
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
      const results = await db.query.bookmarks.findMany({
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
        },
      });

      return { bookmarks: results.map(toZodSchema) };
    }),
});
