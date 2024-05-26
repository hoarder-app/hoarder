import assert from "assert";
import * as dns from "dns";
import type { Job } from "bullmq";
import type { Browser } from "puppeteer";
import { Readability } from "@mozilla/readability";
import { Mutex } from "async-mutex";
import { Worker } from "bullmq";
import DOMPurify from "dompurify";
import { eq } from "drizzle-orm";
import { execa } from "execa";
import { isShuttingDown } from "exit";
import { JSDOM } from "jsdom";
import metascraper from "metascraper";
import metascraperAmazon from "metascraper-amazon";
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
import { bookmarkLinks, bookmarks } from "@hoarder/db/schema";
import {
  deleteAsset,
  newAssetId,
  saveAsset,
  saveAssetFromFile,
} from "@hoarder/shared/assetdb";
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
  metascraperAmazon(),
  metascraperReadability(),
  metascraperTitle(),
  metascraperDescription(),
  metascraperTwitter(),
  metascraperImage(),
  metascraperLogo(),
  metascraperUrl(),
]);

let globalBrowser: Browser | undefined;
// Guards the interactions with the browser instance.
// This is needed given that most of the browser APIs are async.
const browserMutex = new Mutex();

async function startBrowserInstance() {
  const defaultViewport = {
    width: 1440,
    height: 900,
  };
  if (serverConfig.crawler.browserWebSocketUrl) {
    logger.info(
      `[Crawler] Connecting to existing browser websocket address: ${serverConfig.crawler.browserWebSocketUrl}`,
    );
    return await puppeteer.connect({
      browserWSEndpoint: serverConfig.crawler.browserWebSocketUrl,
      defaultViewport,
    });
  } else if (serverConfig.crawler.browserWebUrl) {
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
    return await puppeteer.connect({
      browserURL: webUrl.toString(),
      defaultViewport,
    });
  } else {
    logger.info(`Launching a new browser instance`);
    return await puppeteer.launch({
      headless: serverConfig.crawler.headlessBrowser,
      defaultViewport,
    });
  }
}

async function launchBrowser() {
  globalBrowser = undefined;
  await browserMutex.runExclusive(async () => {
    try {
      globalBrowser = await startBrowserInstance();
    } catch (e) {
      logger.error(
        "[Crawler] Failed to connect to the browser instance, will retry in 5 secs",
      );
      setTimeout(() => {
        launchBrowser();
      }, 5000);
      return;
    }
    globalBrowser.on("disconnected", () => {
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
    if (!serverConfig.crawler.browserConnectOnDemand) {
      await launchBrowser();
    } else {
      logger.info(
        "[Crawler] Browser connect on demand is enabled, won't proactively start the browser instance",
      );
    }

    logger.info("Starting crawler worker ...");
    const worker = new Worker<ZCrawlLinkRequest, void>(
      LinkCrawlerQueue.name,
      withTimeout(
        runCrawler,
        /* timeoutSec */ serverConfig.crawler.jobTimeoutSec,
      ),
      {
        concurrency: serverConfig.crawler.numWorkers,
        connection: queueConnectionDetails,
        autorun: false,
      },
    );

    worker.on("completed", (job) => {
      const jobId = job?.id ?? "unknown";
      logger.info(`[Crawler][${jobId}] Completed successfully`);
      const bookmarkId = job?.data.bookmarkId;
      if (bookmarkId) {
        changeBookmarkStatus(bookmarkId, "success");
      }
    });

    worker.on("failed", (job, error) => {
      const jobId = job?.id ?? "unknown";
      logger.error(`[Crawler][${jobId}] Crawling job failed: ${error}`);
      const bookmarkId = job?.data.bookmarkId;
      if (bookmarkId) {
        changeBookmarkStatus(bookmarkId, "failure");
      }
    });

    return worker;
  }
}

async function changeBookmarkStatus(
  bookmarkId: string,
  crawlStatus: "success" | "failure",
) {
  await db
    .update(bookmarkLinks)
    .set({
      crawlStatus,
    })
    .where(eq(bookmarkLinks.id, bookmarkId));
}

async function getBookmarkDetails(bookmarkId: string) {
  const bookmark = await db.query.bookmarks.findFirst({
    where: eq(bookmarks.id, bookmarkId),
    with: { link: true },
  });

  if (!bookmark || !bookmark.link) {
    throw new Error("The bookmark either doesn't exist or not a link");
  }
  return {
    url: bookmark.link.url,
    userId: bookmark.userId,
    screenshotAssetId: bookmark.link.screenshotAssetId,
    imageAssetId: bookmark.link.imageAssetId,
    fullPageArchiveAssetId: bookmark.link.fullPageArchiveAssetId,
  };
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
  let browser: Browser;
  if (serverConfig.crawler.browserConnectOnDemand) {
    browser = await startBrowserInstance();
  } else {
    assert(globalBrowser);
    browser = globalBrowser;
  }
  assert(browser);
  const context = await browser.createBrowserContext();

  try {
    const page = await context.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    );

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

    const [htmlContent, screenshot] = await Promise.all([
      page.content(),
      page.screenshot({
        // If you change this, you need to change the asset type in the store function.
        type: "png",
        encoding: "binary",
        fullPage: serverConfig.crawler.fullPageScreenshot,
      }),
    ]);
    logger.info(
      `[Crawler][${jobId}] Finished capturing page content and a screenshot. FullPageScreenshot: ${serverConfig.crawler.fullPageScreenshot}`,
    );
    return { htmlContent, screenshot, url: page.url() };
  } finally {
    await context.close();
  }
}

async function extractMetadata(
  htmlContent: string,
  url: string,
  jobId: string,
) {
  logger.info(
    `[Crawler][${jobId}] Will attempt to extract metadata from page ...`,
  );
  const meta = await metascraperParser({
    url,
    html: htmlContent,
    // We don't want to validate the URL again as we've already done it by visiting the page.
    // This was added because URL validation fails if the URL ends with a question mark (e.g. empty query params).
    validateUrl: false,
  });
  logger.info(`[Crawler][${jobId}] Done extracting metadata from the page.`);
  return meta;
}

function extractReadableContent(
  htmlContent: string,
  url: string,
  jobId: string,
) {
  logger.info(
    `[Crawler][${jobId}] Will attempt to extract readable content ...`,
  );
  const window = new JSDOM("").window;
  const purify = DOMPurify(window);
  const purifiedHTML = purify.sanitize(htmlContent);
  const purifiedDOM = new JSDOM(purifiedHTML, { url });
  const readableContent = new Readability(purifiedDOM.window.document).parse();
  logger.info(`[Crawler][${jobId}] Done extracting readable content.`);
  return readableContent;
}

async function storeScreenshot(
  screenshot: Buffer,
  userId: string,
  jobId: string,
) {
  if (!serverConfig.crawler.storeScreenshot) {
    logger.info(
      `[Crawler][${jobId}] Skipping storing the screenshot as per the config.`,
    );
    return null;
  }
  const assetId = newAssetId();
  await saveAsset({
    userId,
    assetId,
    metadata: { contentType: "image/png", fileName: "screenshot.png" },
    asset: screenshot,
  });
  logger.info(
    `[Crawler][${jobId}] Stored the screenshot as assetId: ${assetId}`,
  );
  return assetId;
}

async function downloadAndStoreImage(
  url: string,
  userId: string,
  jobId: string,
) {
  if (!serverConfig.crawler.downloadBannerImage) {
    logger.info(
      `[Crawler][${jobId}] Skipping downloading the image as per the config.`,
    );
    return null;
  }
  try {
    logger.info(`[Crawler][${jobId}] Downloading image from "${url}"`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    const assetId = newAssetId();

    const contentType = response.headers.get("content-type");
    if (!contentType) {
      throw new Error("No content type in the response");
    }

    await saveAsset({
      userId,
      assetId,
      metadata: { contentType },
      asset: Buffer.from(buffer),
    });

    logger.info(
      `[Crawler][${jobId}] Downloaded the image as assetId: ${assetId}`,
    );

    return assetId;
  } catch (e) {
    logger.error(
      `[Crawler][${jobId}] Failed to download and store image: ${e}`,
    );
    return null;
  }
}

async function archiveWebpage(
  html: string,
  url: string,
  userId: string,
  jobId: string,
) {
  logger.info(`[Crawler][${jobId}] Will attempt to archive page ...`);
  const urlParsed = new URL(url);
  const baseUrl = `${urlParsed.protocol}//${urlParsed.host}`;

  const assetId = newAssetId();
  const assetPath = `/tmp/${assetId}`;

  await execa({
    input: html,
  })`monolith  - -Ije -t 5 -b ${baseUrl} -o ${assetPath}`;

  await saveAssetFromFile({
    userId,
    assetId,
    assetPath,
    metadata: {
      contentType: "text/html",
    },
  });

  logger.info(
    `[Crawler][${jobId}] Done archiving the page as assertId: ${assetId}`,
  );

  return assetId;
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
  const {
    url,
    userId,
    screenshotAssetId: oldScreenshotAssetId,
    imageAssetId: oldImageAssetId,
    fullPageArchiveAssetId: oldFullPageArchiveAssetId,
  } = await getBookmarkDetails(bookmarkId);

  logger.info(
    `[Crawler][${jobId}] Will crawl "${url}" for link with id "${bookmarkId}"`,
  );
  validateUrl(url);

  const {
    htmlContent,
    screenshot,
    url: browserUrl,
  } = await crawlPage(jobId, url);

  const [meta, readableContent, screenshotAssetId] = await Promise.all([
    extractMetadata(htmlContent, browserUrl, jobId),
    extractReadableContent(htmlContent, browserUrl, jobId),
    storeScreenshot(screenshot, userId, jobId),
  ]);
  let imageAssetId: string | null = null;
  if (meta.image) {
    imageAssetId = await downloadAndStoreImage(meta.image, userId, jobId);
  }

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
      screenshotAssetId,
      imageAssetId,
      crawledAt: new Date(),
    })
    .where(eq(bookmarkLinks.id, bookmarkId));

  // Delete the old assets if any
  await Promise.all([
    oldScreenshotAssetId
      ? deleteAsset({ userId, assetId: oldScreenshotAssetId }).catch(() => ({}))
      : {},
    oldImageAssetId
      ? deleteAsset({ userId, assetId: oldImageAssetId }).catch(() => ({}))
      : {},
  ]);

  // Enqueue openai job (if not set, assume it's true for backward compatibility)
  if (job.data.runInference !== false) {
    OpenAIQueue.add("openai", {
      bookmarkId,
    });
  }

  // Update the search index
  SearchIndexingQueue.add("search_indexing", {
    bookmarkId,
    type: "index",
  });

  // Do the archival as a separate last step as it has the potential for failure
  if (serverConfig.crawler.fullPageArchive) {
    const fullPageArchiveAssetId = await archiveWebpage(
      htmlContent,
      browserUrl,
      userId,
      jobId,
    );

    await db
      .update(bookmarkLinks)
      .set({
        fullPageArchiveAssetId,
      })
      .where(eq(bookmarkLinks.id, bookmarkId));

    if (oldFullPageArchiveAssetId) {
      deleteAsset({ userId, assetId: oldFullPageArchiveAssetId }).catch(
        () => ({}),
      );
    }
  }
}
