import logger from "@hoarder/shared/logger";
import {
  LinkCrawlerQueue,
  OpenAIQueue,
  SearchIndexingQueue,
  ZCrawlLinkRequest,
  queueConnectionDetails,
  zCrawlLinkRequestSchema,
} from "@hoarder/shared/queues";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

import { Worker } from "bullmq";
import { Job } from "bullmq";

import { db } from "@hoarder/db";

import { Browser } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";

import metascraper from "metascraper";

import metascraperDescription from "metascraper-description";
import metascraperImage from "metascraper-image";
import metascraperLogo from "metascraper-logo-favicon";
import metascraperTitle from "metascraper-title";
import metascraperUrl from "metascraper-url";
import metascraperTwitter from "metascraper-twitter";
import metascraperReadability from "metascraper-readability";
import { Mutex } from "async-mutex";
import assert from "assert";
import serverConfig from "@hoarder/shared/config";
import { bookmarkLinks } from "@hoarder/db/schema";
import { eq } from "drizzle-orm";
import { Readability } from "@mozilla/readability";

const metascraperParser = metascraper([
  metascraperReadability(),
  metascraperTitle(),
  metascraperDescription(),
  metascraperTwitter(),
  metascraperImage(),
  metascraperLogo(),
  metascraperUrl(),
]);

let browser: Browser | undefined;
// Guards the interactions with the browser instance.
// This is needed given that most of the browser APIs are async.
const browserMutex = new Mutex();

async function launchBrowser() {
  browser = undefined;
  await browserMutex.runExclusive(async () => {
    browser = await puppeteer.launch({
      headless: serverConfig.crawler.headlessBrowser,
      executablePath: serverConfig.crawler.browserExecutablePath,
      userDataDir: serverConfig.crawler.browserUserDataDir,
    });
    browser.on("disconnected", async () => {
      logger.info(
        "The puppeteer browser got disconnected. Will attempt to launch it again.",
      );
      await launchBrowser();
    });
  });
}

export class CrawlerWorker {
  static async build() {
    puppeteer.use(StealthPlugin());
    puppeteer.use(
      AdblockerPlugin({
        blockTrackersAndAnnoyances: true,
      }),
    );
    await launchBrowser();

    logger.info("Starting crawler worker ...");
    const worker = new Worker<ZCrawlLinkRequest, void>(
      LinkCrawlerQueue.name,
      runCrawler,
      {
        connection: queueConnectionDetails,
        autorun: false,
      },
    );

    worker.on("completed", (job) => {
      const jobId = job?.id || "unknown";
      logger.info(`[Crawler][${jobId}] Completed successfully`);
    });

    worker.on("failed", (job, error) => {
      const jobId = job?.id || "unknown";
      logger.error(`[Crawler][${jobId}] Crawling job failed: ${error}`);
    });

    return worker;
  }
}

async function getBookmarkUrl(bookmarkId: string) {
  const bookmark = await db.query.bookmarkLinks.findFirst({
    where: eq(bookmarkLinks.id, bookmarkId),
  });

  if (!bookmark) {
    throw new Error("The bookmark either doesn't exist or not a link");
  }
  return bookmark.url;
}

async function crawlPage(url: string) {
  assert(browser);
  const context = await browser.createBrowserContext();

  try {
    const page = await context.newPage();

    await page.goto(url, {
      timeout: 10000, // 10 seconds
    });

    // Wait until there's at most two connections for 2 seconds
    // Attempt to wait only for 5 seconds
    await Promise.race([
      page.waitForNetworkIdle({
        idleTime: 1000, // 1 sec
        concurrency: 2,
      }),
      new Promise((f) => setTimeout(f, 5000)),
    ]);

    const htmlContent = await page.content();
    return htmlContent;
  } finally {
    await context.close();
  }
}

async function runCrawler(job: Job<ZCrawlLinkRequest, void>) {
  const jobId = job.id || "unknown";

  const request = zCrawlLinkRequestSchema.safeParse(job.data);
  if (!request.success) {
    logger.error(
      `[Crawler][${jobId}] Got malformed job request: ${request.error.toString()}`,
    );
    return;
  }

  const { bookmarkId } = request.data;
  const url = await getBookmarkUrl(bookmarkId);

  logger.info(
    `[Crawler][${jobId}] Will crawl "${url}" for link with id "${bookmarkId}"`,
  );
  // TODO(IMPORTANT): Run security validations on the input URL (e.g. deny localhost, etc)

  const htmlContent = await crawlPage(url);

  const meta = await metascraperParser({
    url,
    html: htmlContent,
  });

  const window = new JSDOM("").window;
  const purify = DOMPurify(window);
  const purifiedHTML = purify.sanitize(htmlContent);
  const purifiedDOM = new JSDOM(purifiedHTML, { url });
  const readableContent = new Readability(purifiedDOM.window.document).parse();

  // TODO(important): Restrict the size of content to store

  await db
    .update(bookmarkLinks)
    .set({
      title: meta.title,
      description: meta.description,
      imageUrl: meta.image,
      favicon: meta.logo,
      content: readableContent?.textContent,
      htmlContent: readableContent?.content,
      crawledAt: new Date(),
    })
    .where(eq(bookmarkLinks.id, bookmarkId));

  // Enqueue openai job
  OpenAIQueue.add("openai", {
    bookmarkId,
  });

  // Update the search index
  SearchIndexingQueue.add("search_indexing", {
    bookmarkId,
    type: "index",
  });
}
