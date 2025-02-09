import { eq } from "drizzle-orm";
import { DequeuedJob, Runner } from "liteque";
import fetch from "node-fetch";

import { db } from "@hoarder/db";
import { bookmarks } from "@hoarder/db/schema";
import serverConfig from "@hoarder/shared/config";
import logger from "@hoarder/shared/logger";
import {
  WebhookQueue,
  ZWebhookRequest,
  zWebhookRequestSchema,
} from "@hoarder/shared/queues";

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
          return Promise.resolve();
        },
        onError: async (job) => {
          const jobId = job.id;
          logger.error(
            `[webhook][${jobId}] webhook job failed: ${job.error}\n${job.error.stack}`,
          );
          return Promise.resolve();
        },
      },
      {
        concurrency: 1,
        pollIntervalMs: 1000,
        timeoutSecs:
          serverConfig.webhook.timeoutSec *
            (serverConfig.webhook.retryTimes + 1) +
          1, //consider retry times, and timeout and add 1 second for other stuff
        validator: zWebhookRequestSchema,
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
      user: {
        with: {
          webhooks: true,
        },
      },
    },
  });
}

async function runWebhook(job: DequeuedJob<ZWebhookRequest>) {
  const jobId = job.id;
  const webhookTimeoutSec = serverConfig.webhook.timeoutSec;

  const { bookmarkId } = job.data;
  const bookmark = await fetchBookmark(bookmarkId);
  if (!bookmark) {
    throw new Error(
      `[webhook][${jobId}] bookmark with id ${bookmarkId} was not found`,
    );
  }

  if (!bookmark.user.webhooks) {
    return;
  }

  logger.info(
    `[webhook][${jobId}] Starting a webhook job for bookmark with id "${bookmark.id}"`,
  );

  await Promise.allSettled(
    bookmark.user.webhooks.map(async (webhook) => {
      const url = webhook.url;
      const webhookToken = webhook.token;
      const maxRetries = serverConfig.webhook.retryTimes;
      let attempt = 0;
      let success = false;

      while (attempt < maxRetries && !success) {
        try {
          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(webhookToken
                ? {
                    Authorization: `Bearer ${webhookToken}`,
                  }
                : {}),
            },
            body: JSON.stringify({
              jobId,
              bookmarkId,
              userId: bookmark.userId,
              url: bookmark.link ? bookmark.link.url : undefined,
              type: bookmark.type,
              operation: job.data.operation,
            }),
            signal: AbortSignal.timeout(webhookTimeoutSec * 1000),
          });

          if (!response.ok) {
            logger.error(
              `Webhook call to ${url} failed with status: ${response.status}`,
            );
          } else {
            logger.info(`[webhook][${jobId}] Webhook to ${url} call succeeded`);
            success = true;
          }
        } catch (error) {
          logger.error(
            `[webhook][${jobId}] Webhook to ${url} call failed: ${error}`,
          );
        }
        attempt++;
        if (!success && attempt < maxRetries) {
          logger.info(
            `[webhook][${jobId}] Retrying webhook call to ${url}, attempt ${attempt + 1}`,
          );
        }
      }
    }),
  );
}
