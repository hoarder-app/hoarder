import fs from "fs";
import * as os from "os";
import path from "path";
import { execa } from "execa";
import { DequeuedJob, Runner } from "liteque";

import { db } from "@hoarder/db";
import { AssetTypes } from "@hoarder/db/schema";
import {
  ASSET_TYPES,
  getAssetSize,
  newAssetId,
  saveAssetFromFile,
  silentDeleteAsset,
} from "@hoarder/shared/assetdb";
import serverConfig from "@hoarder/shared/config";
import logger from "@hoarder/shared/logger";
import {
  VideoWorkerQueue,
  ZVideoRequest,
  zvideoRequestSchema,
} from "@hoarder/shared/queues";

import { withTimeout } from "./utils";
import { getBookmarkDetails, updateAsset } from "./workerUtils";

const TMP_FOLDER = path.join(os.tmpdir(), "video_downloads");

export class VideoWorker {
  static build() {
    logger.info("Starting video worker ...");

    return new Runner<ZVideoRequest>(
      VideoWorkerQueue,
      {
        run: withTimeout(
          runWorker,
          /* timeoutSec */ serverConfig.crawler.downloadVideoTimeout,
        ),
        onComplete: async (job) => {
          const jobId = job.id;
          logger.info(
            `[VideoCrawler][${jobId}] Video Download Completed successfully`,
          );
          return Promise.resolve();
        },
        onError: async (job) => {
          const jobId = job.id;
          logger.error(
            `[VideoCrawler][${jobId}] Video Download job failed: ${job.error}`,
          );
          return Promise.resolve();
        },
      },
      {
        pollIntervalMs: 1000,
        timeoutSecs: serverConfig.crawler.downloadVideoTimeout,
        concurrency: 1,
        validator: zvideoRequestSchema,
      },
    );
  }
}

function prepareYtDlpArguments(url: string, assetPath: string) {
  // TODO allow custom commandline arguments?
  const ytDlpArguments = [url];
  if (serverConfig.crawler.maxVideoDownloadSize > 0) {
    ytDlpArguments.push(
      "-f",
      `best[filesize<${serverConfig.crawler.maxVideoDownloadSize}M]`,
    );
  }
  ytDlpArguments.push("-o", assetPath);
  ytDlpArguments.push("--no-playlist");
  return ytDlpArguments;
}

async function runWorker(job: DequeuedJob<ZVideoRequest>) {
  const jobId = job.id;
  const { bookmarkId } = job.data;

  const {
    url,
    userId,
    videoAssetId: oldVideoAssetId,
  } = await getBookmarkDetails(bookmarkId);

  if (!serverConfig.crawler.downloadVideo) {
    logger.info(
      `[VideoCrawler][${jobId}] Skipping video download from "${url}", because it is disabled in the config.`,
    );
    return;
  }

  const videoAssetId = newAssetId();
  let assetPath = `${TMP_FOLDER}/${videoAssetId}`;
  await fs.promises.mkdir(TMP_FOLDER, { recursive: true });

  const ytDlpArguments = prepareYtDlpArguments(url, assetPath);

  try {
    logger.info(
      `[VideoCrawler][${jobId}] Attempting to download a file from "${url}" to "${assetPath}" using the following arguments: "${ytDlpArguments}"`,
    );

    await execa("yt-dlp", ytDlpArguments);
    const downloadPath = await findAssetFile(videoAssetId);
    if (!downloadPath) {
      logger.info(
        "[VideoCrawler][${jobId}] yt-dlp didn't download anything. Skipping ...",
      );
      return;
    }
    assetPath = downloadPath;
  } catch (e) {
    const err = e as Error;
    if (
      err.message.includes(
        "ERROR: Unsupported URL:" || err.message.includes("No media found"),
      )
    ) {
      logger.info(
        `[VideoCrawler][${jobId}] Skipping video download from "${url}", because it's not one of the supported yt-dlp URLs`,
      );
      return;
    }
    console.log(JSON.stringify(err));
    logger.error(
      `[VideoCrawler][${jobId}] Failed to download a file from "${url}" to "${assetPath}"`,
    );
    await deleteLeftOverAssetFile(jobId, videoAssetId);
    return;
  }

  logger.info(
    `[VideoCrawler][${jobId}] Finished downloading a file from "${url}" to "${assetPath}"`,
  );
  await saveAssetFromFile({
    userId,
    assetId: videoAssetId,
    assetPath,
    metadata: { contentType: ASSET_TYPES.VIDEO_MP4 },
  });

  await db.transaction(async (txn) => {
    await updateAsset(
      oldVideoAssetId,
      {
        id: videoAssetId,
        bookmarkId,
        userId,
        assetType: AssetTypes.LINK_VIDEO,
        contentType: ASSET_TYPES.VIDEO_MP4,
        size: await getAssetSize({ userId, assetId: videoAssetId }),
      },
      txn,
    );
  });
  await silentDeleteAsset(userId, oldVideoAssetId);

  logger.info(
    `[VideoCrawler][${jobId}] Finished downloading video from "${url}" and adding it to the database`,
  );
}

/**
 * Deletes leftover assets in case the download fails
 *
 * @param jobId the id of the job
 * @param assetId the id of the asset to delete
 */
async function deleteLeftOverAssetFile(
  jobId: string,
  assetId: string,
): Promise<void> {
  let assetFile;
  try {
    assetFile = await findAssetFile(assetId);
  } catch {
    // ignore exception, no asset file was found
    return;
  }
  if (!assetFile) {
    return;
  }
  logger.info(
    `[VideoCrawler][${jobId}] Deleting leftover video asset "${assetFile}".`,
  );
  try {
    await fs.promises.rm(assetFile);
  } catch (e) {
    logger.error(
      `[VideoCrawler][${jobId}] Failed deleting leftover video asset "${assetFile}".`,
    );
  }
}

/**
 * yt-dlp automatically adds a file ending to the passed in filename --> we have to search it again in the folder
 *
 * @param assetId the id of the asset to search
 * @returns the path to the downloaded asset
 */
async function findAssetFile(assetId: string): Promise<string | null> {
  const files = await fs.promises.readdir(TMP_FOLDER);
  for (const file of files) {
    if (file.startsWith(assetId)) {
      return path.join(TMP_FOLDER, file);
    }
  }
  return null;
}
