import logger from "@remember/shared/logger";
import {
  OpenAIQueue,
  ZCrawlLinkRequest,
  zCrawlLinkRequestSchema,
} from "@remember/shared/queues";
import { Job } from "bullmq";

import prisma from "@remember/db";

import { Browser } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

import metascraper from "metascraper";

import metascraperDescription from "metascraper-description";
import metascraperImage from "metascraper-image";
import metascraperLogo from "metascraper-logo-favicon";
import metascraperTitle from "metascraper-title";
import metascraperUrl from "metascraper-url";
import metascraperTwitter from "metascraper-twitter";
import metascraperReadability from "metascraper-readability";

const metascraperParser = metascraper([
  metascraperReadability(),
  metascraperTitle(),
  metascraperDescription(),
  metascraperTwitter(),
  metascraperImage(),
  metascraperLogo(),
  metascraperUrl(),
]);

let browser: Browser;
(async () => {
  puppeteer.use(StealthPlugin());
  // TODO: Configure the browser mode via an env variable
  browser = await puppeteer.launch({ headless: true });
})();

async function crawlPage(url: string) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();

  await page.goto(url, {
    timeout: 10000, // 10 seconds
    waitUntil: "networkidle2",
  });

  const htmlContent = await page.content();
  await context.close();
  return htmlContent;
}

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

  const htmlContent = await crawlPage(url);

  const meta = await metascraperParser({
    url,
    html: htmlContent,
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
