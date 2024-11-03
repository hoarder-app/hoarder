import { and, eq, inArray } from "drizzle-orm";
import { DequeuedJob, Runner } from "liteque";
import Parser from "rss-parser";
import { buildImpersonatingTRPCClient } from "trpc";

import type { ZFeedRequestSchema } from "@hoarder/shared/queues";
import { db } from "@hoarder/db";
import { rssFeedImportsTable, rssFeedsTable } from "@hoarder/db/schema";
import logger from "@hoarder/shared/logger";
import { FeedQueue } from "@hoarder/shared/queues";
import { BookmarkTypes } from "@hoarder/shared/types/bookmarks";

export class FeedWorker {
  static build() {
    logger.info("Starting feed worker ...");
    const worker = new Runner<ZFeedRequestSchema>(
      FeedQueue,
      {
        run: run,
        onComplete: async (job) => {
          const jobId = job.id;
          logger.info(`[feed][${jobId}] Completed successfully`);
          await db
            .update(rssFeedsTable)
            .set({ lastFetchedStatus: "success", lastFetchedAt: new Date() })
            .where(eq(rssFeedsTable.id, job.data?.feedId));
        },
        onError: async (job) => {
          const jobId = job.id;
          logger.error(
            `[feed][${jobId}] Feed fetch job failed: ${job.error}\n${job.error.stack}`,
          );
          if (job.data) {
            await db
              .update(rssFeedsTable)
              .set({ lastFetchedStatus: "failure", lastFetchedAt: new Date() })
              .where(eq(rssFeedsTable.id, job.data?.feedId));
          }
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

async function run(req: DequeuedJob<ZFeedRequestSchema>) {
  const jobId = req.id;
  const feed = await db.query.rssFeedsTable.findFirst({
    where: eq(rssFeedsTable.id, req.data.feedId),
  });
  if (!feed) {
    throw new Error(
      `[feed][${jobId}] Feed with id ${req.data.feedId} not found`,
    );
  }

  const response = await fetch(feed.url, {
    signal: AbortSignal.timeout(5000),
  });
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/xml")) {
    throw new Error(
      `[feed][${jobId}] Feed with id ${req.data.feedId} is not a valid RSS feed`,
    );
  }
  const xmlData = await response.text();

  logger.info(
    `[feed][${jobId}] Successfully fetched feed "${feed.name}" (${feed.id}) ...`,
  );

  const parser = new Parser();
  const feedData = await parser.parseString(xmlData);

  logger.info(
    `[feed][${jobId}] Found ${feedData.items.length} entries in feed "${feed.name}" (${feed.id}) ...`,
  );

  if (feedData.items.length === 0) {
    logger.info(`[feed][${jobId}] No entries found.`);
    return;
  }

  const exitingEntries = await db.query.rssFeedImportsTable.findMany({
    where: and(
      eq(rssFeedImportsTable.rssFeedId, feed.id),
      inArray(
        rssFeedImportsTable.entryId,
        feedData.items
          .map((item) => item.guid)
          .filter((id): id is string => !!id),
      ),
    ),
  });

  const newEntries = feedData.items.filter(
    (item) =>
      !exitingEntries.some((entry) => entry.entryId === item.guid) && item.link,
  );

  if (newEntries.length === 0) {
    logger.info(
      `[feed][${jobId}] No new entries found in feed "${feed.name}" (${feed.id}).`,
    );
    return;
  }

  logger.info(
    `[feed][${jobId}] Found ${newEntries.length} new entries in feed "${feed.name}" (${feed.id}) ...`,
  );

  const trpcClient = await buildImpersonatingTRPCClient(feed.userId);

  const createdBookmarks = await Promise.allSettled(
    newEntries.map((item) =>
      trpcClient.bookmarks.createBookmark({
        type: BookmarkTypes.LINK,
        url: item.link!,
      }),
    ),
  );

  // It's ok if this is not transactional as the bookmarks will get linked in the next iteration.
  await db
    .insert(rssFeedImportsTable)
    .values(
      newEntries.map((item, idx) => {
        const b = createdBookmarks[idx];
        return {
          entryId: item.guid!,
          bookmarkId: b.status === "fulfilled" ? b.value.id : null,
          rssFeedId: feed.id,
        };
      }),
    )
    .onConflictDoNothing();

  logger.info(
    `[feed][${jobId}] Successfully imported ${newEntries.length} new enteries from feed "${feed.name}" (${feed.id}).`,
  );

  return Promise.resolve();
}
