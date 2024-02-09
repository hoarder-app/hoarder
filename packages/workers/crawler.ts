import logger from "@remember/shared/logger";
import {
  OpenAIQueue,
  ZCrawlLinkRequest,
  zCrawlLinkRequestSchema,
} from "@remember/shared/queues";
import { Job } from "bullmq";

import prisma from "@remember/db";

import metascraper from "metascraper";

import metascraperDescription from "metascraper-description";
import metascraperImage from "metascraper-image";
import metascraperLogo from "metascraper-logo-favicon";
import metascraperTitle from "metascraper-title";
import metascraperUrl from "metascraper-url";

const metascraperParser = metascraper([
  metascraperDescription(),
  metascraperImage(),
  metascraperLogo(),
  metascraperTitle(),
  metascraperUrl(),
]);

export default async function runCrawler(job: Job<ZCrawlLinkRequest, void>) {
  const jobId = job.id || "unknown";

  const request = zCrawlLinkRequestSchema.safeParse(job.data);
  if (!request.success) {
    logger.error(
      `[Crawler][${jobId}] Got malformed job request: ${request.error.toString()}`,
    );
    return;
  }

  const { url, bookmarkId } = request.data;

  logger.info(
    `[Crawler][${jobId}] Will crawl "${url}" for link with id "${bookmarkId}"`,
  );
  // TODO(IMPORTANT): Run security validations on the input URL (e.g. deny localhost, etc)

  const resp = await fetch(url);
  const respBody = await resp.text();

  const meta = await metascraperParser({
    url,
    html: respBody,
  });

  await prisma.bookmarkedLink.update({
    where: {
      id: bookmarkId,
    },
    data: {
      title: meta.title,
      description: meta.description,
      imageUrl: meta.image,
      favicon: meta.logo,
      crawledAt: new Date(),
    },
  });

  // Enqueue openai job
  OpenAIQueue.add("openai", {
    bookmarkId,
  });
}
