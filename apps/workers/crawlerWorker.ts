import assert from "assert";
import * as dns from "dns";
import * as path from "node:path";
import { Readability } from "@mozilla/readability";
import { Mutex } from "async-mutex";
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
import { Browser, Frame, Page } from "puppeteer";
import puppeteer from "puppeteer-extra";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { withTimeout } from "utils";

import type { ZCrawlLinkRequest } from "@hoarder/shared/queues";
import { db, HoarderDBTransaction } from "@hoarder/db";
import {
  assets,
  AssetTypes,
  bookmarkAssets,
  bookmarkLinks,
  bookmarks,
} from "@hoarder/db/schema";
import { DequeuedJob, Runner } from "@hoarder/queue";
import {
  ASSET_TYPES,
  deleteAsset,
  IMAGE_ASSET_TYPES,
  newAssetId,
  saveAsset,
  saveAssetFromFile,
  SUPPORTED_UPLOAD_ASSET_TYPES,
} from "@hoarder/shared/assetdb";
import serverConfig from "@hoarder/shared/config";
import logger from "@hoarder/shared/logger";
import {
  LinkCrawlerQueue,
  OpenAIQueue,
  triggerSearchReindex,
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
    logger.info(`Launching a new browser instance`);
    return puppeteer.launch({
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
      if (isShuttingDown) {
        logger.info("[Crawler] We're shutting down so won't retry.");
        return;
      }
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
    const worker = new Runner<ZCrawlLinkRequest>(
      LinkCrawlerQueue,
      {
        run: withTimeout(
          runCrawler,
          /* timeoutSec */ serverConfig.crawler.jobTimeoutSec,
        ),
        onComplete: async (job) => {
          const jobId = job?.id ?? "unknown";
          logger.info(`[Crawler][${jobId}] Completed successfully`);
          const bookmarkId = job?.data.bookmarkId;
          if (bookmarkId) {
            await changeBookmarkStatus(bookmarkId, "success");
          }
        },
        onError: async (job) => {
          const jobId = job?.id ?? "unknown";
          logger.error(`[Crawler][${jobId}] Crawling job failed: ${job.error}`);
          const bookmarkId = job.data?.bookmarkId;
          if (bookmarkId) {
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
    with: {
      link: true,
      assets: true,
    },
  });

  if (!bookmark || !bookmark.link) {
    throw new Error("The bookmark either doesn't exist or not a link");
  }
  return {
    url: bookmark.link.url,
    userId: bookmark.userId,
    screenshotAssetId: bookmark.assets.find(
      (a) => a.assetType == AssetTypes.LINK_SCREENSHOT,
    )?.id,
    imageAssetId: bookmark.assets.find(
      (a) => a.assetType == AssetTypes.LINK_BANNER_IMAGE,
    )?.id,
    fullPageArchiveAssetId: bookmark.assets.find(
      (a) => a.assetType == AssetTypes.LINK_FULL_PAGE_ARCHIVE,
    )?.id,
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
      waitUntil: "networkidle0",
    });

    logger.info(
      `[Crawler][${jobId}] Successfully navigated to "${url}". Waiting for the page to load ...`,
    );

    logger.info(`[Crawler][${jobId}] Clicking Cookie Consent Banner.`);
    await acceptCookies(page, jobId);

    logger.info(`[Crawler][${jobId}] Hiding Consent Banner if Still Visible.`);
    await hideConsentBanner(page, jobId);

    await Promise.race([
      page.waitForNetworkIdle({
        idleTime: 2000, // Wait for 2 seconds of no significant nework activity
        concurrency: 0, // No active network connections
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
    return {
      htmlContent,
      screenshot,
      url: page.url(),
    };
  } finally {
    await context.close();
  }
}

async function hideConsentBanner(page: Page, jobId: string) {
  // Hide banners in the main document
  await applyHideConsentBanner(page);

  // Hide banners in all iframes
  const frames = page.frames();
  for (const frame of frames) {
    if (frame !== page.mainFrame()) {
      try {
        await applyHideConsentBanner(frame);
      } catch (error) {
        if (error instanceof Error) {
          logger.warn(
            `[Crawler][${jobId}] Unable to hide consent banner in frame "${frame.url()}": ${error.message}`,
          );
        } else {
          logger.warn(
            `[Crawler][${jobId}] Unknown error occurred while hiding consent banner in frame "${frame.url()}": ${String(error)}`,
          );
        }
      }
    }
  }
}

async function applyHideConsentBanner(frame: Frame | Page) {
  await frame.evaluate(() => {
    const style = document.createElement("style");
    style.textContent = `
      .cookie-banner, .consent-banner, .gdpr-banner, .cookie-consent, .cookie-notice,
      .cookie-popup, .cookie-policy-banner, .cookie-warning, .cookie-bar, .cookie-message,
      .cookie-container, .cookie-acceptance, .cookie-disclaimer, .cookie-info, .cookie-overlay, .cmp-banner,
      #cookieBanner, #cookieConsent, #cookieNotice, #cookiePolicy, #gdprBanner, #consentPopup, #privacyBanner {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  });
}

async function acceptCookies(page: Page, jobId: string) {
  const cookieKeywords = [
    "accept",
    "agree",
    "got it",
    "consent",
    "allow",
    "enable",
    "continue",
    "accept all",
    "agree and proceed",
    "confirm",
    "accept cookies",
    "accept and close",
    "I accept",
    "I agree", // English
    "akzeptieren",
    "zustimmen",
    "alle akzeptieren",
    "alle zustimmen",
    "erlauben",
    "weiter",
    "zustimmen und fortfahren",
    "zustimmen und weiter",
    "bestätigen",
    "cookies akzeptieren",
    "ich akzeptiere",
    "ich stimme zu",
    "akzeptieren und schließen",
    "akzeptieren und weiter", // German
    "accepter",
    "continuer",
    "autoriser", // French
    "aceptar",
    "continuar",
    "permitir", // Spanish
    "accetta",
    "consenti",
    "continua", // Italian
  ];

  try {
    // Attempt to click consent buttons in the main frame
    const clicked = await clickConsentButton(page, cookieKeywords, jobId);
    if (clicked) return;

    // If no buttons were found in the main frame, check all iframes
    const frames = page.frames();
    for (const frame of frames) {
      if (frame !== page.mainFrame()) {
        try {
          const frameClicked = await clickConsentButton(
            frame,
            cookieKeywords,
            jobId,
          );
          if (frameClicked) return;
        } catch (error) {
          if (error instanceof Error) {
            logger.warn(
              `[Crawler][${jobId}] Unable to access frame "${frame.url()}": ${error.message}`,
            );
          } else {
            logger.warn(
              `[Crawler][${jobId}] Unknown error occurred while accessing frame "${frame.url()}": ${String(error)}`,
            );
          }
        }
      }
    }
    logger.warn(`[Crawler][${jobId}] No matching cookie consent button found.`);
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        `[Crawler][${jobId}] Error occurred while attempting to accept cookies: ${error.message}`,
      );
    } else {
      logger.error(
        `[Crawler][${jobId}] Unknown error occurred while attempting to accept cookies: ${String(error)}`,
      );
    }
  }
  logger.info(`[Crawler][${jobId}] Finished acceptCookies function.`);
}

async function clickConsentButton(
  frame: Frame | Page,
  cookieKeywords: string[],
  jobId: string,
) {
  const elements = await frame.$$("button, a, span");
  for (const element of elements) {
    const text = await element.evaluate(
      (el) => el.textContent?.toLowerCase().trim() ?? "",
    );
    const matchedKeyword = cookieKeywords.find((keyword) => text === keyword);
    if (matchedKeyword) {
      try {
        const isVisible = await element.isIntersectingViewport({
          threshold: 0.5,
        });
        if (!isVisible) {
          continue; // Skip if element is not visible
        }
        await frame.evaluate((el) => {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.click();
        }, element);
        logger.info(
          `[Crawler][${jobId}] Clicked cookie consent button with text: "${text}" using keyword: "${matchedKeyword}".`,
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return true;
      } catch (error) {
        if (error instanceof Error) {
          logger.error(
            `[Crawler][${jobId}] Failed to click the consent button with text: "${text}". Error: ${error.message}`,
          );
        } else {
          logger.error(
            `[Crawler][${jobId}] Unknown error occurred while clicking the consent button with text: "${text}". Error: ${String(error)}`,
          );
        }
      }
    }
  }
  return false;
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

    return assetId;
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
  })`monolith  - -Ije -t 5 -b ${url} -o ${assetPath}`;

  await saveAssetFromFile({
    userId,
    assetId,
    assetPath,
    metadata: {
      contentType: "text/html",
    },
  });

  logger.info(
    `[Crawler][${jobId}] Done archiving the page as assetId: ${assetId}`,
  );

  return assetId;
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
  const assetId = await downloadAndStoreFile(url, userId, jobId, assetType);
  if (!assetId) {
    return;
  }
  await db.transaction(async (trx) => {
    await trx.insert(bookmarkAssets).values({
      id: bookmarkId,
      assetType,
      assetId,
      content: null,
      fileName: path.basename(new URL(url).pathname),
      sourceUrl: url,
    });
    // Switch the type of the bookmark from LINK to ASSET
    await trx
      .update(bookmarks)
      .set({ type: BookmarkTypes.ASSET })
      .where(eq(bookmarks.id, bookmarkId));
    await trx.delete(bookmarkLinks).where(eq(bookmarkLinks.id, bookmarkId));
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
) {
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
      })
      .where(eq(bookmarkLinks.id, bookmarkId));

    await updateAsset(
      screenshotAssetId,
      oldScreenshotAssetId,
      bookmarkId,
      AssetTypes.LINK_SCREENSHOT,
      txn,
    );
    await updateAsset(
      imageAssetId,
      oldImageAssetId,
      bookmarkId,
      AssetTypes.LINK_BANNER_IMAGE,
      txn,
    );
  });

  // Delete the old assets if any
  await Promise.all([
    oldScreenshotAssetId
      ? deleteAsset({ userId, assetId: oldScreenshotAssetId }).catch(() => ({}))
      : {},
    oldImageAssetId
      ? deleteAsset({ userId, assetId: oldImageAssetId }).catch(() => ({}))
      : {},
  ]);

  return async () => {
    if (serverConfig.crawler.fullPageArchive) {
      const fullPageArchiveAssetId = await archiveWebpage(
        htmlContent,
        browserUrl,
        userId,
        jobId,
      );

      await db.transaction(async (txn) => {
        await updateAsset(
          fullPageArchiveAssetId,
          oldFullPageArchiveAssetId,
          bookmarkId,
          AssetTypes.LINK_FULL_PAGE_ARCHIVE,
          txn,
        );
      });
      if (oldFullPageArchiveAssetId) {
        await deleteAsset({ userId, assetId: oldFullPageArchiveAssetId }).catch(
          () => ({}),
        );
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

  const contentType = await getContentType(url, jobId);

  // Link bookmarks get transformed into asset bookmarks if they point to a supported asset instead of a webpage
  const isPdf = contentType === ASSET_TYPES.APPLICATION_PDF;

  let archivalLogic: () => Promise<void> = () => {
    return Promise.resolve();
  };
  if (isPdf) {
    await handleAsAssetBookmark(url, "pdf", userId, jobId, bookmarkId);
  } else if (
    contentType &&
    IMAGE_ASSET_TYPES.has(contentType) &&
    SUPPORTED_UPLOAD_ASSET_TYPES.has(contentType)
  ) {
    await handleAsAssetBookmark(url, "image", userId, jobId, bookmarkId);
  } else {
    archivalLogic = await crawlAndParseUrl(
      url,
      userId,
      jobId,
      bookmarkId,
      oldScreenshotAssetId,
      oldImageAssetId,
      oldFullPageArchiveAssetId,
    );
  }

  // Enqueue openai job (if not set, assume it's true for backward compatibility)
  if (job.data.runInference !== false) {
    await OpenAIQueue.enqueue({
      bookmarkId,
    });
  }

  // Update the search index
  await triggerSearchReindex(bookmarkId);

  // Do the archival as a separate last step as it has the potential for failure
  await archivalLogic();
}

/**
 * Removes the old asset and adds a new one instead
 * @param newAssetId the new assetId to add
 * @param oldAssetId the old assetId to remove (if it exists)
 * @param bookmarkId the id of the bookmark the asset belongs to
 * @param assetType the type of the asset
 * @param txn the transaction where this update should happen in
 */
async function updateAsset(
  newAssetId: string | null,
  oldAssetId: string | undefined,
  bookmarkId: string,
  assetType: AssetTypes,
  txn: HoarderDBTransaction,
) {
  if (newAssetId) {
    if (oldAssetId) {
      await txn.delete(assets).where(eq(assets.id, oldAssetId));
    }
    await txn.insert(assets).values({
      id: newAssetId,
      assetType,
      bookmarkId,
    });
  }
}
