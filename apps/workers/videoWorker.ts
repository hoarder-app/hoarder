import fs from "fs";
import path from "path";
import YTDlpWrap from "yt-dlp-wrap";

import { db } from "@hoarder/db";
import { AssetTypes } from "@hoarder/db/schema";
import { DequeuedJob, Runner } from "@hoarder/queue";
import {
  ASSET_TYPES,
  getAssetSize,
  newAssetId,
  saveAssetFromFile,
} from "@hoarder/shared/assetdb";
import serverConfig from "@hoarder/shared/config";
import logger from "@hoarder/shared/logger";
import { VideoWorkerQueue, ZVideoRequest } from "@hoarder/shared/queues";

import { withTimeout } from "./utils";
import { getBookmarkDetails, updateAsset } from "./workerUtils";

const YT_DLP_BINARY = path.join(
  serverConfig.dataDir,
  process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp",
);
const TMP_FOLDER = path.join(serverConfig.dataDir, "tmp");

export class VideoWorker {
  static async build() {
    logger.info("Starting video worker ...");

    const ytDlpAvailable = await prepareYTDLP();
    if (!ytDlpAvailable) {
      logger.error(
        `[VideoCrawler] Unable to download yt-dlp. Video download will not be available!`,
      );
      return;
    }

    return new Runner<ZVideoRequest>(
      VideoWorkerQueue,
      {
        run: withTimeout(
          runCrawler,
          /* timeoutSec */ serverConfig.crawler.downloadVideoTimeout,
        ),
        onComplete: async (job) => {
          const jobId = job?.id ?? "unknown";
          logger.info(
            `[VideoCrawler][${jobId}] Video Download Completed successfully`,
          );
          return Promise.resolve();
        },
        onError: async (job) => {
          const jobId = job?.id ?? "unknown";
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
      },
    );
  }
}

async function getYTDLPVersion() {
  try {
    const ytDlpWrap1 = new YTDlpWrap(YT_DLP_BINARY);
    const version = await ytDlpWrap1.getVersion();
    logger.info(`[VideoCrawler] yt-dlp version available: ${version}`);
    return version;
  } catch (e) {
    logger.error(
      `[VideoCrawler] Failed to determine yt-dlp version. It probably does not exist: ${e}`,
    );
  }
}

async function prepareYTDLP(): Promise<boolean> {
  const version = await getYTDLPVersion();
  if (version) {
    return true;
  }

  logger.info(
    `[VideoCrawler] Trying to download the latest version of yt-dlp to "${YT_DLP_BINARY}".`,
  );
  try {
    await YTDlpWrap.downloadFromGithub(YT_DLP_BINARY);
    await getYTDLPVersion();
    return true;
  } catch (e) {
    logger.error(
      `[VideoCrawler] Failed to download the latest version of yt-dlp`,
    );
    return false;
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
  return ytDlpArguments;
}

async function runCrawler(job: DequeuedJob<ZVideoRequest>) {
  const jobId = job.id ?? "unknown";
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

  const ytDlpWrap = new YTDlpWrap(YT_DLP_BINARY);
  try {
    logger.info(
      `[VideoCrawler][${jobId}] Attempting to download a file from "${url}" to "${assetPath}" using the following arguments:"${ytDlpArguments}"`,
    );
    await ytDlpWrap.execPromise(ytDlpArguments);
    assetPath = await findAssetFile(jobId, videoAssetId);
  } catch (e) {
    logger.error(
      `[VideoCrawler][${jobId}] Failed to download a file from "${url}" to "${assetPath}": ${e}`,
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
        fileName: path.basename(assetPath),
      },
      txn,
    );
  });

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
    assetFile = await findAssetFile(jobId, assetId);
  } catch {
    // ignore exception, no asset file was found
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
 * @param jobId id of the job
 * @param assetId the id of the asset to search
 * @returns the path to the downloaded asset
 */
async function findAssetFile(jobId: string, assetId: string): Promise<string> {
  const files = await fs.promises.readdir(TMP_FOLDER);
  for (const file of files) {
    if (file.startsWith(assetId)) {
      return path.join(TMP_FOLDER, file);
    }
  }
  throw Error(
    `[VideoCrawler][${jobId}] Unable to find file with assetId ${assetId}`,
  );
}
