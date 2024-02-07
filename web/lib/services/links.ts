import { LinkCrawlerQueue } from "@remember/shared/queues";
import prisma from "@remember/db";

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
  });

  // Enqueue crawling request
  await LinkCrawlerQueue.add("crawl", {
    linkId: link.id,
    url: link.url,
  });

  return link;
}

export async function getLinks(userId: string) {
  return await prisma.bookmarkedLink.findMany({
    where: {
      userId,
    },
    select: {
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
    },
  });
}
