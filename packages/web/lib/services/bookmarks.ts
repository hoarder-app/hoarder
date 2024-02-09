import { LinkCrawlerQueue } from "@remember/shared/queues";
import prisma from "@remember/db";
import {
  ZBookmark,
  ZBookmarkContent,
  ZGetBookmarksRequest,
  ZUpdateBookmarksRequest,
} from "@/lib/types/api/bookmarks";

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

export async function updateBookmark(
  bookmarkId: string,
  userId: string,
  req: ZUpdateBookmarksRequest,
) {
  const bookmark = await prisma.bookmark.update({
    where: {
      id: bookmarkId,
      userId,
    },
    data: req,
    select: defaultBookmarkFields,
  });
  return toZodSchema(bookmark);
}

export async function deleteBookmark(bookmarkId: string, userId: string) {
  await prisma.bookmark.delete({
    where: {
      id: bookmarkId,
      userId,
    },
  });
}

export async function bookmarkLink(url: string, userId: string) {
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
}

export async function getBookmarks(
  userId: string,
  { favourited, archived }: ZGetBookmarksRequest,
) {
  return (
    await prisma.bookmark.findMany({
      where: {
        userId,
        archived,
        favourited,
      },
      select: defaultBookmarkFields,
    })
  ).map(toZodSchema);
}
