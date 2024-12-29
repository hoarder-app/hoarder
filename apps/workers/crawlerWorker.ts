import * as dns from "dns";
import { promises as fs } from "fs";
import * as path from "node:path";
import * as os from "os";
import type { Browser } from "puppeteer";
import { PuppeteerBlocker } from "@ghostery/adblocker-puppeteer";
import { Readability } from "@mozilla/readability";
import { Mutex } from "async-mutex";
import DOMPurify from "dompurify";
import { eq } from "drizzle-orm";
import { execa } from "execa";
import { isShuttingDown } from "exit";
import { JSDOM } from "jsdom";
import { DequeuedJob, Runner } from "liteque";
import metascraper from "metascraper";
import metascraperAmazon from "metascraper-amazon";
import metascraperDescription from "metascraper-description";
import metascraperImage from "metascraper-image";
import metascraperLogo from "metascraper-logo-favicon";
import metascraperReadability from "metascraper-readability";
import metascraperTitle from "metascraper-title";
import metascraperTwitter from "metascraper-twitter";
import metascraperUrl from "metascraper-url";
import fetch from "node-fetch";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { withTimeout } from "utils";
import { getBookmarkDetails, updateAsset } from "workerUtils";

import type { ZCrawlLinkRequest } from "@hoarder/shared/queues";
import { db } from "@hoarder/db";
import {
  assets,
  AssetTypes,
  bookmarkAssets,
  bookmarkLinks,
  bookmarks,
} from "@hoarder/db/schema";
import {
  ASSET_TYPES,
  getAssetSize,
  IMAGE_ASSET_TYPES,
  newAssetId,
  saveAsset,
  saveAssetFromFile,
  silentDeleteAsset,
  SUPPORTED_UPLOAD_ASSET_TYPES,
} from "@hoarder/shared/assetdb";
import serverConfig from "@hoarder/shared/config";
import logger from "@hoarder/shared/logger";
import {
  AssetPreprocessingQueue,
  LinkCrawlerQueue,
  OpenAIQueue,
  triggerSearchReindex,
  triggerVideoWorker,
  zCrawlLinkRequestSchema,
} from "@hoarder/shared/queues";
import { BookmarkTypes } from "@hoarder/shared/types/bookmarks";

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
let globalBlocker: PuppeteerBlocker | undefined;
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
    return puppeteer.connect({
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
    return puppeteer.connect({
      browserURL: webUrl.toString(),
      defaultViewport,
    });
  } else {
    logger.info(`Running in browserless mode`);
    return undefined;
  }
}

async function launchBrowser() {
  globalBrowser = undefined;
  await browserMutex.runExclusive(async () => {
    try {
      globalBrowser = await startBrowserInstance();
    } catch (e) {
      logger.error(
        `[Crawler] Failed to connect to the browser instance, will retry in 5 secs: ${(e as Error).stack}`,
      );
      if (isShuttingDown) {
        logger.info("[Crawler] We're shutting down so won't retry.");
        return;
      }
      setTimeout(() => {
        launchBrowser();
      }, 5000);
      return;
    }
    globalBrowser?.on("disconnected", () => {
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
    if (serverConfig.crawler.enableAdblocker) {
      try {
        logger.info("[crawler] Loading adblocker ...");
        globalBlocker = await PuppeteerBlocker.fromPrebuiltFull(fetch, {
          path: path.join(os.tmpdir(), "hoarder_adblocker.bin"),
          read: fs.readFile,
          write: fs.writeFile,
        });
      } catch (e) {
        logger.error(
          `[crawler] Failed to load adblocker. Will not be blocking ads: ${e}`,
        );
      }
    }
    if (!serverConfig.crawler.browserConnectOnDemand) {
      await launchBrowser();
    } else {
      logger.info(
        "[Crawler] Browser connect on demand is enabled, won't proactively start the browser instance",
      );
    }

    logger.info("Starting crawler worker ...");
    const worker = new Runner<ZCrawlLinkRequest>(
      LinkCrawlerQueue,
      {
        run: withTimeout(
          runCrawler,
          /* timeoutSec */ serverConfig.crawler.jobTimeoutSec,
        ),
        onComplete: async (job) => {
          const jobId = job.id;
          logger.info(`[Crawler][${jobId}] Completed successfully`);
          const bookmarkId = job.data.bookmarkId;
          if (bookmarkId) {
            await changeBookmarkStatus(bookmarkId, "success");
          }
        },
        onError: async (job) => {
          const jobId = job.id;
          logger.error(
            `[Crawler][${jobId}] Crawling job failed: ${job.error}\n${job.error.stack}`,
          );
          const bookmarkId = job.data?.bookmarkId;
          if (bookmarkId && job.numRetriesLeft == 0) {
            await changeBookmarkStatus(bookmarkId, "failure");
          }
        },
      },
      {
        pollIntervalMs: 1000,
        timeoutSecs: serverConfig.crawler.jobTimeoutSec,
        concurrency: serverConfig.crawler.numWorkers,
      },
    );

    return worker;
  }
}

type DBAssetType = typeof assets.$inferInsert;

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

async function browserlessCrawlPage(jobId: string, url: string) {
  logger.info(
    `[Crawler][${jobId}] Running in browserless mode. Will do a plain http request to "${url}". Screenshots will be disabled.`,
  );
  const response = await fetch(url, {
    signal: AbortSignal.timeout(5000),
  });
  logger.info(
    `[Crawler][${jobId}] Successfully fetched the content of "${url}". Status: ${response.status}, Size: ${response.size}`,
  );
  return {
    htmlContent: await response.text(),
    statusCode: response.status,
    screenshot: undefined,
    url: response.url,
  };
}

async function crawlPage(
  jobId: string,
  url: string,
): Promise<{
  htmlContent: string;
  screenshot: Buffer | undefined;
  statusCode: number;
  url: string;
}> {
  let browser: Browser | undefined;
  if (serverConfig.crawler.browserConnectOnDemand) {
    browser = await startBrowserInstance();
  } else {
    browser = globalBrowser;
  }
  if (!browser) {
    return browserlessCrawlPage(jobId, url);
  }
  const context = await browser.createBrowserContext();

  try {
    const page = await context.newPage();
    if (globalBlocker) {
      await globalBlocker.enableBlockingInPage(page);
    }
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    );

    const response = await page.goto(url, {
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
    logger.info(`[Crawler][${jobId}] Successfully fetched the page content.`);

    let screenshot: Buffer | undefined = undefined;
    if (serverConfig.crawler.storeScreenshot) {
      screenshot = await Promise.race<Buffer | undefined>([
        page
          .screenshot({
            // If you change this, you need to change the asset type in the store function.
            type: "png",
            encoding: "binary",
            fullPage: serverConfig.crawler.fullPageScreenshot,
          })
          .catch(() => undefined),
        new Promise((f) => setTimeout(f, 5000)),
      ]);
      if (!screenshot) {
        logger.warn(`[Crawler][${jobId}] Failed to capture the screenshot.`);
      } else {
        logger.info(
          `[Crawler][${jobId}] Finished capturing page content and a screenshot. FullPageScreenshot: ${serverConfig.crawler.fullPageScreenshot}`,
        );
      }
    }

    return {
      htmlContent,
      statusCode: response?.status() ?? 0,
      screenshot,
      url: page.url(),
    };
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
  screenshot: Buffer | undefined,
  userId: string,
  jobId: string,
) {
  if (!serverConfig.crawler.storeScreenshot) {
    logger.info(
      `[Crawler][${jobId}] Skipping storing the screenshot as per the config.`,
    );
    return null;
  }
  if (!screenshot) {
    logger.info(
      `[Crawler][${jobId}] Skipping storing the screenshot as it's empty.`,
    );
    return null;
  }
  const assetId = newAssetId();
  const contentType = "image/png";
  const fileName = "screenshot.png";
  await saveAsset({
    userId,
    assetId,
    metadata: { contentType, fileName },
    asset: screenshot,
  });
  logger.info(
    `[Crawler][${jobId}] Stored the screenshot as assetId: ${assetId}`,
  );
  return { assetId, contentType, fileName, size: screenshot.byteLength };
}

async function downloadAndStoreFile(
  url: string,
  userId: string,
  jobId: string,
  fileType: string,
) {
  try {
    logger.info(`[Crawler][${jobId}] Downloading ${fileType} from "${url}"`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download ${fileType}: ${response.status}`);
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
      `[Crawler][${jobId}] Downloaded ${fileType} as assetId: ${assetId}`,
    );

    return { assetId, userId, contentType, size: buffer.byteLength };
  } catch (e) {
    logger.error(
      `[Crawler][${jobId}] Failed to download and store ${fileType}: ${e}`,
    );
    return null;
  }
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
  return downloadAndStoreFile(url, userId, jobId, "image");
}

async function archiveWebpage(
  html: string,
  url: string,
  userId: string,
  jobId: string,
) {
  logger.info(`[Crawler][${jobId}] Will attempt to archive page ...`);
  const assetId = newAssetId();
  const assetPath = `/tmp/${assetId}`;

  await execa({
    input: html,
  })("monolith", ["-", "-Ije", "-t", "5", "-b", url, "-o", assetPath]);

  const contentType = "text/html";

  await saveAssetFromFile({
    userId,
    assetId,
    assetPath,
    metadata: {
      contentType,
    },
  });

  logger.info(
    `[Crawler][${jobId}] Done archiving the page as assetId: ${assetId}`,
  );

  return {
    assetId,
    contentType,
    size: await getAssetSize({ userId, assetId }),
  };
}

async function getContentType(
  url: string,
  jobId: string,
): Promise<string | null> {
  try {
    logger.info(
      `[Crawler][${jobId}] Attempting to determine the content-type for the url ${url}`,
    );
    const response = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
    });
    const contentType = response.headers.get("content-type");
    logger.info(
      `[Crawler][${jobId}] Content-type for the url ${url} is "${contentType}"`,
    );
    return contentType;
  } catch (e) {
    logger.error(
      `[Crawler][${jobId}] Failed to determine the content-type for the url ${url}: ${e}`,
    );
    return null;
  }
}

/**
 * Downloads the asset from the URL and transforms the linkBookmark to an assetBookmark
 * @param url the url the user provided
 * @param assetType the type of the asset we're downloading
 * @param userId the id of the user
 * @param jobId the id of the job for logging
 * @param bookmarkId the id of the bookmark
 */
async function handleAsAssetBookmark(
  url: string,
  assetType: "image" | "pdf",
  userId: string,
  jobId: string,
  bookmarkId: string,
) {
  const downloaded = await downloadAndStoreFile(url, userId, jobId, assetType);
  if (!downloaded) {
    return;
  }
  const fileName = path.basename(new URL(url).pathname);
  await db.transaction(async (trx) => {
    await updateAsset(
      undefined,
      {
        id: downloaded.assetId,
        bookmarkId,
        userId,
        assetType: AssetTypes.BOOKMARK_ASSET,
        contentType: downloaded.contentType,
        size: downloaded.size,
        fileName,
      },
      trx,
    );
    await trx.insert(bookmarkAssets).values({
      id: bookmarkId,
      assetType,
      assetId: downloaded.assetId,
      content: null,
      fileName,
      sourceUrl: url,
    });
    // Switch the type of the bookmark from LINK to ASSET
    await trx
      .update(bookmarks)
      .set({ type: BookmarkTypes.ASSET })
      .where(eq(bookmarks.id, bookmarkId));
    await trx.delete(bookmarkLinks).where(eq(bookmarkLinks.id, bookmarkId));
  });
  await AssetPreprocessingQueue.enqueue({
    bookmarkId,
  });
}

async function crawlAndParseUrl(
  url: string,
  userId: string,
  jobId: string,
  bookmarkId: string,
  oldScreenshotAssetId: string | undefined,
  oldImageAssetId: string | undefined,
  oldFullPageArchiveAssetId: string | undefined,
  archiveFullPage: boolean,
) {
  const {
    htmlContent,
    screenshot,
    statusCode,
    url: browserUrl,
  } = await crawlPage(jobId, url);

  const [meta, readableContent, screenshotAssetInfo] = await Promise.all([
    extractMetadata(htmlContent, browserUrl, jobId),
    extractReadableContent(htmlContent, browserUrl, jobId),
    storeScreenshot(screenshot, userId, jobId),
  ]);
  let imageAssetInfo: DBAssetType | null = null;
  if (meta.image) {
    const downloaded = await downloadAndStoreImage(meta.image, userId, jobId);
    if (downloaded) {
      imageAssetInfo = {
        id: downloaded.assetId,
        bookmarkId,
        userId,
        assetType: AssetTypes.LINK_BANNER_IMAGE,
        contentType: downloaded.contentType,
        size: downloaded.size,
      };
    }
  }

  // TODO(important): Restrict the size of content to store
  await db.transaction(async (txn) => {
    await txn
      .update(bookmarkLinks)
      .set({
        title: meta.title,
        description: meta.description,
        imageUrl: meta.image,
        favicon: meta.logo,
        content: readableContent?.textContent,
        htmlContent: readableContent?.content,
        crawledAt: new Date(),
        crawlStatusCode: statusCode,
      })
      .where(eq(bookmarkLinks.id, bookmarkId));

    if (screenshotAssetInfo) {
      await updateAsset(
        oldScreenshotAssetId,
        {
          id: screenshotAssetInfo.assetId,
          bookmarkId,
          userId,
          assetType: AssetTypes.LINK_SCREENSHOT,
          contentType: screenshotAssetInfo.contentType,
          size: screenshotAssetInfo.size,
          fileName: screenshotAssetInfo.fileName,
        },
        txn,
      );
    }
    if (imageAssetInfo) {
      await updateAsset(oldImageAssetId, imageAssetInfo, txn);
    }
  });

  // Delete the old assets if any
  await Promise.all([
    silentDeleteAsset(userId, oldScreenshotAssetId),
    silentDeleteAsset(userId, oldImageAssetId),
  ]);

  return async () => {
    if (serverConfig.crawler.fullPageArchive || archiveFullPage) {
      const {
        assetId: fullPageArchiveAssetId,
        size,
        contentType,
      } = await archiveWebpage(htmlContent, browserUrl, userId, jobId);

      await db.transaction(async (txn) => {
        await updateAsset(
          oldFullPageArchiveAssetId,
          {
            id: fullPageArchiveAssetId,
            bookmarkId,
            userId,
            assetType: AssetTypes.LINK_FULL_PAGE_ARCHIVE,
            contentType,
            size,
            fileName: null,
          },
          txn,
        );
      });
      if (oldFullPageArchiveAssetId) {
        silentDeleteAsset(userId, oldFullPageArchiveAssetId);
      }
    }
  };
}

async function runCrawler(job: DequeuedJob<ZCrawlLinkRequest>) {
  const jobId = job.id ?? "unknown";

  const request = zCrawlLinkRequestSchema.safeParse(job.data);
  if (!request.success) {
    logger.error(
      `[Crawler][${jobId}] Got malformed job request: ${request.error.toString()}`,
    );
    return;
  }

  const { bookmarkId, archiveFullPage } = request.data;
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

  const contentType = await getContentType(url, jobId);

  // Link bookmarks get transformed into asset bookmarks if they point to a supported asset instead of a webpage
  const isPdf = contentType === ASSET_TYPES.APPLICATION_PDF;

  if (isPdf) {
    await handleAsAssetBookmark(url, "pdf", userId, jobId, bookmarkId);
  } else if (
    contentType &&
    IMAGE_ASSET_TYPES.has(contentType) &&
    SUPPORTED_UPLOAD_ASSET_TYPES.has(contentType)
  ) {
    await handleAsAssetBookmark(url, "image", userId, jobId, bookmarkId);
  } else {
    const archivalLogic = await crawlAndParseUrl(
      url,
      userId,
      jobId,
      bookmarkId,
      oldScreenshotAssetId,
      oldImageAssetId,
      oldFullPageArchiveAssetId,
      archiveFullPage,
    );

    // Enqueue openai job (if not set, assume it's true for backward compatibility)
    if (job.data.runInference !== false) {
      await OpenAIQueue.enqueue({
        bookmarkId,
      });
    }

    // Update the search index
    await triggerSearchReindex(bookmarkId);

    // Trigger a potential download of a video from the URL
    await triggerVideoWorker(bookmarkId, url);

    // Do the archival as a separate last step as it has the potential for failure
    await archivalLogic();
  }
}
