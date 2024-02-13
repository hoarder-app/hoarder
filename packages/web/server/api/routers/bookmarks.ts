import { z } from "zod";
import { authedProcedure, router } from "../trpc";
import {
  ZBookmark,
  ZBookmarkContent,
  zBookmarkSchema,
  zGetBookmarksRequestSchema,
  zGetBookmarksResponseSchema,
  zNewBookmarkRequestSchema,
  zUpdateBookmarksRequestSchema,
} from "@/lib/types/api/bookmarks";
import { prisma } from "@remember/db";
import { LinkCrawlerQueue } from "@remember/shared/queues";

const defaultBookmarkFields = {
  id: true,
  favourited: true,
  archived: true,
  createdAt: true,
  link: {
    select: {
      url: true,
      title: true,
      description: true,
      imageUrl: true,
      favicon: true,
    },
  },
  tags: {
    include: {
      tag: true,
    },
  },
};

async function dummyPrismaReturnType() {
  const x = await prisma.bookmark.findFirstOrThrow({
    select: defaultBookmarkFields,
  });
  return x;
}

function toZodSchema(
  bookmark: Awaited<ReturnType<typeof dummyPrismaReturnType>>,
): ZBookmark {
  const { tags, link, ...rest } = bookmark;

  let content: ZBookmarkContent;
  if (link) {
    content = { type: "link", ...link };
  } else {
    throw new Error("Unknown content type");
  }

  return {
    tags: tags.map((t) => t.tag),
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
      const userId = ctx.user.id;

      const bookmark = await prisma.bookmark.create({
        data: {
          link: {
            create: {
              url,
            },
          },
          userId,
        },
        select: defaultBookmarkFields,
      });

      // Enqueue crawling request
      await LinkCrawlerQueue.add("crawl", {
        bookmarkId: bookmark.id,
        url: url,
      });

      return toZodSchema(bookmark);
    }),

  updateBookmark: authedProcedure
    .input(zUpdateBookmarksRequestSchema)
    .output(zBookmarkSchema)
    .mutation(async ({ input, ctx }) => {
      const bookmark = await prisma.bookmark.update({
        where: {
          id: input.bookmarkId,
          userId: ctx.user.id,
        },
        data: {
          archived: input.archived,
          favourited: input.favourited,
        },
        select: defaultBookmarkFields,
      });
      return toZodSchema(bookmark);
    }),

  deleteBookmark: authedProcedure
    .input(z.object({ bookmarkId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await prisma.bookmark.delete({
        where: {
          id: input.bookmarkId,
          userId: ctx.user.id,
        },
      });
    }),
  getBookmarks: authedProcedure
    .input(zGetBookmarksRequestSchema)
    .output(zGetBookmarksResponseSchema)
    .query(async ({ input, ctx }) => {
      const bookmarks = (
        await prisma.bookmark.findMany({
          where: {
            userId: ctx.user.id,
            archived: input.archived,
            favourited: input.favourited,
          },
          orderBy: {
            createdAt: "desc",
          },
          select: defaultBookmarkFields,
        })
      ).map(toZodSchema);

      return { bookmarks };
    }),
  getBookmarksById: authedProcedure
    .input(
      zGetBookmarksRequestSchema.merge(
        z.object({
          ids: z.array(z.string()),
        }),
      ),
    )
    .output(zGetBookmarksResponseSchema)
    .query(async ({ input, ctx }) => {
      const bookmarks = (
        await prisma.bookmark.findMany({
          where: {
            id: {
              in: input.ids,
            },
            userId: ctx.user.id,
            archived: input.archived,
            favourited: input.favourited,
          },
          orderBy: {
            createdAt: "desc",
          },
          select: defaultBookmarkFields,
        })
      ).map(toZodSchema);

      return { bookmarks };
    }),
});
