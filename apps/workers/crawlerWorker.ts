import assert from "assert";
import * as dns from "dns";
import type { Job } from "bullmq";
import type { Browser } from "puppeteer";
import { Readability } from "@mozilla/readability";
import { Mutex } from "async-mutex";
import { Worker } from "bullmq";
import DOMPurify from "dompurify";
import { eq } from "drizzle-orm";
import { isShuttingDown } from "exit";
import { JSDOM } from "jsdom";
import metascraper from "metascraper";
import metascraperDescription from "metascraper-description";
import metascraperImage from "metascraper-image";
import metascraperLogo from "metascraper-logo-favicon";
import metascraperReadability from "metascraper-readability";
import metascraperTitle from "metascraper-title";
import metascraperTwitter from "metascraper-twitter";
import metascraperUrl from "metascraper-url";
import puppeteer from "puppeteer-extra";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { withTimeout } from "utils";

import type { ZCrawlLinkRequest } from "@hoarder/shared/queues";
import { db } from "@hoarder/db";
import { bookmarkLinks } from "@hoarder/db/schema";
import serverConfig from "@hoarder/shared/config";
import logger from "@hoarder/shared/logger";
import {
  LinkCrawlerQueue,
  OpenAIQueue,
  queueConnectionDetails,
  SearchIndexingQueue,
  zCrawlLinkRequestSchema,
} from "@hoarder/shared/queues";

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
    try {
      if (serverConfig.crawler.browserWebUrl) {
        logger.info(
          `[Crawler] Connecting to existing browser instance: ${serverConfig.crawler.browserWebUrl}`,
        );
        const webUrl = new URL(serverConfig.crawler.browserWebUrl);
        // We need to resolve the ip address as a workaround for https://github.com/puppeteer/puppeteer/issues/2242
        const { address: address } = await dns.promises.lookup(webUrl.hostname);
        webUrl.hostname = address;
        logger.info(
          `[Crawler] Successfully resolved IP address, new address: ${webUrl.toString()}`,
        );
        browser = await puppeteer.connect({
          browserURL: webUrl.toString(),
        });
      } else {
        logger.info(`Launching a new browser instance`);
        browser = await puppeteer.launch({
          headless: serverConfig.crawler.headlessBrowser,
        });
      }
    } catch (e) {
      logger.error(
        "[Crawler] Failed to connect to the browser instance, will retry in 5 secs",
      );
      setTimeout(() => {
        launchBrowser();
      }, 5000);
      return;
    }
    browser.on("disconnected", () => {
      if (isShuttingDown) {
        logger.info(
          "[Crawler] The puppeteer browser got disconnected. But we're shutting down so won't restart it.",
        );
        return;
      }
      logger.info(
        "[Crawler] The puppeteer browser got disconnected. Will attempt to launch it again.",
      );
      launchBrowser();
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
      withTimeout(
        runCrawler,
        /* timeoutSec */ serverConfig.crawler.jobTimeoutSec,
      ),
      {
        connection: queueConnectionDetails,
        autorun: false,
      },
    );

    worker.on("completed", (job) => {
      const jobId = job?.id ?? "unknown";
      logger.info(`[Crawler][${jobId}] Completed successfully`);
    });

    worker.on("failed", (job, error) => {
      const jobId = job?.id ?? "unknown";
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

/**
 * This provides some "basic" protection from malicious URLs. However, all of those
 * can be easily circumvented by pointing dns of origin to localhost, or with
 * redirects.
 */
function validateUrl(url: string) {
  const urlParsed = new URL(url);
  if (urlParsed.protocol != "http:" && urlParsed.protocol != "https:") {
    throw new Error(`Unsupported URL protocol: ${urlParsed.protocol}`);
  }

  if (["localhost", "127.0.0.1", "0.0.0.0"].includes(urlParsed.hostname)) {
    throw new Error(`Link hostname rejected: ${urlParsed.hostname}`);
  }
}

async function crawlPage(jobId: string, url: string) {
  assert(browser);
  const context = await browser.createBrowserContext();

  try {
    const page = await context.newPage();

    await page.goto(url, {
      timeout: serverConfig.crawler.navigateTimeoutSec * 1000,
    });
    logger.info(
      `[Crawler][${jobId}] Successfully navigated to "${url}". Waiting for the page to load ...`,
    );

    // Wait until there's at most two connections for 2 seconds
    // Attempt to wait only for 5 seconds
    await Promise.race([
      page.waitForNetworkIdle({
        idleTime: 1000, // 1 sec
        concurrency: 2,
      }),
      new Promise((f) => setTimeout(f, 5000)),
    ]);

    logger.info(`[Crawler][${jobId}] Finished waiting for the page to load.`);

    const htmlContent = await page.content();
    return htmlContent;
  } finally {
    await context.close();
  }
}

async function runCrawler(job: Job<ZCrawlLinkRequest, void>) {
  const jobId = job.id ?? "unknown";

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
  validateUrl(url);

  const htmlContent = await crawlPage(jobId, url);

  logger.info(
    `[Crawler][${jobId}] Will attempt to parse the content of the page ...`,
  );
  const meta = await metascraperParser({
    url,
    html: htmlContent,
    // We don't want to validate the URL again as we've already done it by visiting the page.
    // This was added because URL validation fails if the URL ends with a question mark (e.g. empty query params).
    validateUrl: false,
  });
  logger.info(`[Crawler][${jobId}] Done parsing the content of the page.`);

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
