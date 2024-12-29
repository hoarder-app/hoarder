import { eq } from "drizzle-orm";
import { DequeuedJob, Runner } from "liteque";

import { db } from "@hoarder/db";
import { assets } from "@hoarder/db/schema";
import { deleteAsset, getAllAssets } from "@hoarder/shared/assetdb";
import logger from "@hoarder/shared/logger";
import {
  TidyAssetsQueue,
  ZTidyAssetsRequest,
  zTidyAssetsRequestSchema,
} from "@hoarder/shared/queues";

export class TidyAssetsWorker {
  static build() {
    logger.info("Starting tidy assets worker ...");
    const worker = new Runner<ZTidyAssetsRequest>(
      TidyAssetsQueue,
      {
        run: runTidyAssets,
        onComplete: (job) => {
          const jobId = job.id;
          logger.info(`[tidyAssets][${jobId}] Completed successfully`);
          return Promise.resolve();
        },
        onError: (job) => {
          const jobId = job.id;
          logger.error(
            `[tidyAssets][${jobId}] tidy assets job failed: ${job.error}\n${job.error.stack}`,
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

async function handleAsset(
  asset: {
    assetId: string;
    userId: string;
    size: number;
    contentType: string;
    fileName?: string | null;
  },
  request: ZTidyAssetsRequest,
  jobId: string,
) {
  const dbRow = await db.query.assets.findFirst({
    where: eq(assets.id, asset.assetId),
  });
  if (!dbRow) {
    if (request.cleanDanglingAssets) {
      await deleteAsset({ userId: asset.userId, assetId: asset.assetId });
      logger.info(
        `[tidyAssets][${jobId}] Asset ${asset.assetId} not found in the database. Deleting it.`,
      );
    } else {
      logger.warn(
        `[tidyAssets][${jobId}] Asset ${asset.assetId} not found in the database. Not deleting it because cleanDanglingAssets is false.`,
      );
    }
    return;
  }

  if (request.syncAssetMetadata) {
    await db
      .update(assets)
      .set({
        contentType: asset.contentType,
        fileName: asset.fileName,
        size: asset.size,
      })
      .where(eq(assets.id, asset.assetId));
    logger.info(
      `[tidyAssets][${jobId}] Updated metadata for asset ${asset.assetId}`,
    );
  }
}

async function runTidyAssets(job: DequeuedJob<ZTidyAssetsRequest>) {
  const jobId = job.id;

  const request = zTidyAssetsRequestSchema.safeParse(job.data);
  if (!request.success) {
    throw new Error(
      `[tidyAssets][${jobId}] Got malformed job request: ${request.error.toString()}`,
    );
  }

  for await (const asset of getAllAssets()) {
    try {
      handleAsset(asset, request.data, jobId);
    } catch (e) {
      logger.error(
        `[tidyAssets][${jobId}] Failed to tidy asset ${asset.assetId}: ${e}`,
      );
    }
  }
}
