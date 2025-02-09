import os from "os";
import { eq } from "drizzle-orm";
import { DequeuedJob, Runner } from "liteque";
import PDFParser from "pdf2json";
import { fromBuffer } from "pdf2pic";
import { createWorker } from "tesseract.js";

import type { AssetPreprocessingRequest } from "@hoarder/shared/queues";
import { db } from "@hoarder/db";
import {
  assets,
  AssetTypes,
  bookmarkAssets,
  bookmarks,
} from "@hoarder/db/schema";
import { readAsset } from "@hoarder/shared/assetdb";
import serverConfig from "@hoarder/shared/config";
import logger from "@hoarder/shared/logger";
import {
  AssetPreprocessingQueue,
  OpenAIQueue,
  triggerSearchReindex,
} from "@hoarder/shared/queues";

import { storeScreenshot } from "./crawlerWorker";

export class AssetPreprocessingWorker {
  static build() {
    logger.info("Starting asset preprocessing worker ...");
    const worker = new Runner<AssetPreprocessingRequest>(
      AssetPreprocessingQueue,
      {
        run: run,
        onComplete: async (job) => {
          const jobId = job.id;
          logger.info(`[assetPreprocessing][${jobId}] Completed successfully`);
          return Promise.resolve();
        },
        onError: async (job) => {
          const jobId = job.id;
          logger.error(
            `[assetPreprocessing][${jobId}] Asset preprocessing failed: ${job.error}\n${job.error.stack}`,
          );
          return Promise.resolve();
        },
      },
      {
        concurrency: 1,
        pollIntervalMs: 1000,
        timeoutSecs: 30,
      },
    );

    return worker;
  }
}

async function readImageText(buffer: Buffer) {
  if (serverConfig.ocr.langs.length == 1 && serverConfig.ocr.langs[0] == "") {
    return null;
  }
  const worker = await createWorker(serverConfig.ocr.langs, undefined, {
    cachePath: serverConfig.ocr.cacheDir ?? os.tmpdir(),
  });
  try {
    const ret = await worker.recognize(buffer);
    if (ret.data.confidence <= serverConfig.ocr.confidenceThreshold) {
      return null;
    }
    return ret.data.text;
  } finally {
    await worker.terminate();
  }
}

async function readPDFText(buffer: Buffer): Promise<{
  text: string;
  metadata: Record<string, object>;
}> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, true);
    pdfParser.on("pdfParser_dataError", reject);
    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      resolve({
        text: pdfParser.getRawTextContent(),
        metadata: pdfData.Meta,
      });
    });
    pdfParser.parseBuffer(buffer);
  });
}

export async function extractAndSavePDFScreenshot(
  pdfBuffer: Buffer,
  userId: string,
  bookmarkId: string,
  jobId: string,
): Promise<boolean> {
  try {
    logger.info(
      `[${jobId}] Attempting to generate PDF screenshot for bookmarkId: ${bookmarkId}`,
    );
    /**
     * If you encountered any issues with this library, make sure you have ghostscript and graphicsmagick installed following this URL
     * https://github.com/yakovmeister/pdf2image/blob/HEAD/docs/gm-installation.md
     */
    const screenshot = await fromBuffer(pdfBuffer, {
      density: 100,
      quality: 100,
      format: "png",
      preserveAspectRatio: true,
    })(1, { responseType: "buffer" });

    if (!screenshot.buffer) {
      logger.error(`[${jobId}] Failed to generate PDF screenshot`);
      return false;
    }

    // Store the screenshot
    const asset = await storeScreenshot(screenshot.buffer, userId, jobId);

    if (!asset) {
      logger.error(`[${jobId}] Failed to store PDF screenshot`);
      return false;
    }

    // Insert into database
    await db.insert(assets).values({
      id: asset.assetId,
      bookmarkId,
      userId,
      assetType: AssetTypes.LINK_SCREENSHOT,
      contentType: asset.contentType,
      size: asset.size,
      fileName: asset.fileName,
    });

    logger.info(`[${jobId}] Successfully saved PDF screenshot to database`);
    return true;
  } catch (error) {
    logger.error(`[${jobId}] Failed to process PDF screenshot: ${error}`);
    return false;
  }
}

async function preprocessImage(
  jobId: string,
  asset: Buffer,
): Promise<{ content: string; metadata: string | null } | undefined> {
  let imageText = null;
  try {
    imageText = await readImageText(asset);
  } catch (e) {
    logger.error(
      `[assetPreprocessing][${jobId}] Failed to read image text: ${e}`,
    );
  }
  if (!imageText) {
    return undefined;
  }

  logger.info(
    `[assetPreprocessing][${jobId}] Extracted ${imageText.length} characters from image.`,
  );
  return { content: imageText, metadata: null };
}

async function preProcessPDF(
  jobId: string,
  asset: Buffer,
): Promise<
  | {
      content: string;
      metadata: string | null;
    }
  | undefined
> {
  const pdfParse = await readPDFText(asset);
  if (!pdfParse?.text) {
    throw new Error(
      `[assetPreprocessing][${jobId}] PDF text is empty. Please make sure that the PDF includes text and not just images.`,
    );
  }
  logger.info(
    `[assetPreprocessing][${jobId}] Extracted ${pdfParse.text.length} characters from pdf.`,
  );
  return {
    content: pdfParse.text,
    metadata: pdfParse.metadata ? JSON.stringify(pdfParse.metadata) : null,
  };
}

async function run(req: DequeuedJob<AssetPreprocessingRequest>) {
  const jobId = req.id;
  const bookmarkId = req.data.bookmarkId;

  const bookmark = await db.query.bookmarks.findFirst({
    where: eq(bookmarks.id, bookmarkId),
    with: {
      asset: true,
    },
  });

  logger.info(
    `[assetPreprocessing][${jobId}] Starting an asset preprocessing job for bookmark with id "${bookmarkId}"`,
  );

  if (!bookmark) {
    throw new Error(`[assetPreprocessing][${jobId}] Bookmark not found`);
  }

  if (!bookmark.asset) {
    throw new Error(
      `[assetPreprocessing][${jobId}] Bookmark is not an asset (not an image or pdf)`,
    );
  }

  const { asset } = await readAsset({
    userId: bookmark.userId,
    assetId: bookmark.asset.assetId,
  });

  if (!asset) {
    throw new Error(
      `[assetPreprocessing][${jobId}] AssetId ${bookmark.asset.assetId} for bookmark ${bookmarkId} not found`,
    );
  }

  let result:
    | {
        content: string;
        metadata: string | null;
      }
    | undefined = undefined;

  switch (bookmark.asset.assetType) {
    case "image":
      result = await preprocessImage(jobId, asset);
      break;
    case "pdf":
      result = await preProcessPDF(jobId, asset);
      await extractAndSavePDFScreenshot(
        asset,
        bookmark.userId,
        bookmarkId,
        jobId,
      );
      break;
    default:
      throw new Error(
        `[assetPreprocessing][${jobId}] Unsupported bookmark type`,
      );
  }

  if (result) {
    await db
      .update(bookmarkAssets)
      .set({
        content: result.content,
        metadata: result.metadata,
      })
      .where(eq(bookmarkAssets.id, bookmarkId));
  }

  await OpenAIQueue.enqueue({
    bookmarkId,
  });

  // Update the search index
  await triggerSearchReindex(bookmarkId);
}
