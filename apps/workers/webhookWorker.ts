import { DequeuedJob, Runner } from "liteque";
import { db } from "@hoarder/db";
import { bookmarks } from "@hoarder/db/schema";
import serverConfig from "@hoarder/shared/config";
import logger from "@hoarder/shared/logger";
import { WebhookQueue, zWebhookRequestSchema, ZWebhookRequest } from "@hoarder/shared/queues";
import { eq } from "drizzle-orm";
import fetch from 'node-fetch';
import { Response } from 'node-fetch';

export class WebhookWorker {
  static build() {
    logger.info("Starting webhook worker ...");
    const worker = new Runner<ZWebhookRequest>(
      WebhookQueue,
      {
        run: runWebhook,
        onComplete: async (job) => {
          const jobId = job.id;
          logger.info(`[webhook][${jobId}] Completed successfully`);
        },
        onError: async (job) => {
          const jobId = job.id;
          logger.error(
            `[webhook][${jobId}] webhook job failed: ${job.error}\n${job.error.stack}`,
          )
        },
      },
      {
        concurrency: 1,
        pollIntervalMs: 1000,
        timeoutSecs: serverConfig.webhook.timeout / 1000 * (serverConfig.webhook.retryTimes + 1) * serverConfig.webhook.urls.length + 1,  //consider retry times, urls, and timeout and add 1 second for other stuff
      },
    );

    return worker;
  }
}


async function fetchBookmark(linkId: string) {
  return await db.query.bookmarks.findFirst({
    where: eq(bookmarks.id, linkId),
    with: {
      link: true,
      text: true,
      asset: true,
    },
  });
}

async function runWebhook(job: DequeuedJob<ZWebhookRequest>) {
  const jobId = job.id;
  const webhookUrls = serverConfig.webhook.urls;
  const webhookToken = serverConfig.webhook.token;
  const webhookTimeout = serverConfig.webhook.timeout;

  const request = zWebhookRequestSchema.safeParse(job.data);
  if (!request.success) {
    throw new Error(
      `[webhook][${jobId}] Got malformed job request: ${request.error.toString()}`,
    );
  }

  const { bookmarkId } = request.data;
  const bookmark = await fetchBookmark(bookmarkId);
  if (!bookmark) {
    throw new Error(
      `[webhook][${jobId}] bookmark with id ${bookmarkId} was not found`,
    );
  }

  logger.info(
    `[webhook][${jobId}] Starting a webhook job for bookmark with id "${bookmark.id}"`,
  );

  for (const url of webhookUrls) {
    const maxRetries = serverConfig.webhook.retryTimes;
    let attempt = 0;
    let success = false;

    while (attempt < maxRetries && !success) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${webhookToken}`,
          },
          body: JSON.stringify({
            jobId, bookmarkId, userId: bookmark.userId, url: bookmark.link.url, type: bookmark.type, operation: job.data.operation
          }),
          signal: AbortSignal.timeout(webhookTimeout)
        });

        if (!response.ok) {
          logger.error(`Webhook call to ${url} failed with status: ${response.status}`);
        } else {
          logger.info(`[webhook][${jobId}] Webhook to ${url} call succeeded`);
          success = true;
        }
      } catch (error) {
        logger.error(`[webhook][${jobId}] Webhook to ${url} call failed: ${error}`);
      }
      attempt++;
      if (!success && attempt < maxRetries) {
        logger.info(`[webhook][${jobId}] Retrying webhook call to ${url}, attempt ${attempt + 1}`);
      }
    }
  }
}