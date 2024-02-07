import { LinkCrawlerQueue } from "@remember/shared/queues";
import prisma from "@remember/db";
import { ZBookmarkedLink } from "@/lib/types/api/links";

const defaultLinkFields = {
  id: true,
  url: true,
  createdAt: true,
  details: {
    select: {
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
  return await prisma.bookmarkedLink.findFirstOrThrow({
    select: defaultLinkFields,
  });
}

function toZodSchema(
  link: Awaited<ReturnType<typeof dummyPrismaReturnType>>,
): ZBookmarkedLink {
  return {
    id: link.id,
    url: link.url,
    createdAt: link.createdAt,
    details: link.details,
    tags: link.tags.map((t) => t.tag),
  };
}

export async function unbookmarkLink(linkId: string, userId: string) {
  await prisma.bookmarkedLink.delete({
    where: {
      id: linkId,
      userId,
    },
  });
}

export async function bookmarkLink(url: string, userId: string) {
  const link = await prisma.bookmarkedLink.create({
    data: {
      url,
      userId,
    },
    select: defaultLinkFields,
  });

  // Enqueue crawling request
  await LinkCrawlerQueue.add("crawl", {
    linkId: link.id,
    url: link.url,
  });

  return toZodSchema(link);
}

export async function getLinks(userId: string) {
  return (
    await prisma.bookmarkedLink.findMany({
      where: {
        userId,
      },
      select: defaultLinkFields,
    })
  ).map(toZodSchema);
}
