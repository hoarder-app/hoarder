import { and, eq, inArray } from "drizzle-orm";
import { DequeuedJob, Runner } from "liteque";
import cron from "node-cron";
import Parser from "rss-parser";
import { buildImpersonatingTRPCClient } from "trpc";
import { z } from "zod";

import type { ZFeedRequestSchema } from "@hoarder/shared/queues";
import { db } from "@hoarder/db";
import { rssFeedImportsTable, rssFeedsTable } from "@hoarder/db/schema";
import logger from "@hoarder/shared/logger";
import { FeedQueue } from "@hoarder/shared/queues";
import { BookmarkTypes } from "@hoarder/shared/types/bookmarks";

export const FeedRefreshingWorker = cron.schedule(
  "0 * * * *",
  () => {
    logger.info("[feed] Scheduling feed refreshing jobs ...");
    db.query.rssFeedsTable
      .findMany({
        columns: {
          id: true,
        },
      })
      .then((feeds) => {
        for (const feed of feeds) {
          FeedQueue.enqueue(
            {
              feedId: feed.id,
            },
            {
              idempotencyKey: feed.id,
            },
          );
        }
      });
  },
  {
    runOnInit: false,
    scheduled: false,
  },
);

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
  logger.info(
    `[feed][${jobId}] Starting fetching feed "${feed.name}" (${feed.id}) ...`,
  );

  const response = await fetch(feed.url, {
    signal: AbortSignal.timeout(5000),
    headers: {
      UserAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "application/rss+xml",
    },
  });
  if (response.status !== 200) {
    throw new Error(
      `[feed][${jobId}] Feed "${feed.name}" (${feed.id}) returned a non-success status: ${response.status}.`,
    );
  }
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("xml")) {
    throw new Error(
      `[feed][${jobId}] Feed "${feed.name}" (${feed.id}) is not a valid RSS feed`,
    );
  }
  const xmlData = await response.text();

  logger.info(
    `[feed][${jobId}] Successfully fetched feed "${feed.name}" (${feed.id}) ...`,
  );

  const parser = new Parser({
    customFields: {
      item: ["id"],
    },
  });
  const unparseFeedData = await parser.parseString(xmlData);

  // Check if this is a Wallabag feed
  const isWallabagFeed = unparseFeedData.items.some(
    (item) =>
      item.id && typeof item.id === "string" && item.id.includes("wallabag:"),
  );

  if (isWallabagFeed) {
    logger.info(
      `[feed][${jobId}] Detected Wallabag feed, extracting original URLs...`,
    );

    // Extract original URLs from the XML
    const extractOriginalLinks = (
      xmlContent: string,
    ): Record<string, string> => {
      const result: Record<string, string> = {};

      try {
        // Match each entry in the feed
        const entryRegex = /<entry[\s\S]*?<\/entry>/g;
        let entryMatch;

        while ((entryMatch = entryRegex.exec(xmlContent)) !== null) {
          const entry = entryMatch[0];

          // Extract the entry ID
          const idMatch = entry.match(/<id>(.*?)<\/id>/);
          if (!idMatch || !idMatch[1]) continue;
          const id = idMatch[1];

          // Extract all links
          const links: { href: string; rel: string | null }[] = [];
          const linkRegex = /<link([^>]*)>/g;
          let linkMatch;

          while ((linkMatch = linkRegex.exec(entry)) !== null) {
            const linkAttrs = linkMatch[1];
            const hrefMatch = linkAttrs.match(/href="([^"]*)"/);

            if (hrefMatch && hrefMatch[1]) {
              // Check if it has a rel attribute
              const relMatch = linkAttrs.match(/rel="([^"]*)"/);
              const rel = relMatch ? relMatch[1] : null;

              links.push({
                href: hrefMatch[1],
                rel: rel,
              });
            }
          }

          // Select the best link according to priority:
          // 1. Link with no rel attribute (original content URL)
          // 2. Link with rel="via" (also original content URL)

          // First look for link with no rel
          const noRelLink = links.find((link) => link.rel === null);
          if (noRelLink) {
            result[id] = noRelLink.href;
            continue;
          }

          // Then look for link with rel="via"
          const viaLink = links.find((link) => link.rel === "via");
          if (viaLink) {
            result[id] = viaLink.href;
          }
        }
      } catch (error) {
        logger.error(
          `[feed][${jobId}] Error extracting original links: ${error}`,
        );
      }

      return result;
    };

    const originalLinks = extractOriginalLinks(xmlData);

    // Apply the original links to the parsed items
    unparseFeedData.items.forEach((item) => {
      if (item.id && typeof item.id === "string" && originalLinks[item.id]) {
        // Replace the link with the original URL
        item.link = originalLinks[item.id];
      }
    });
  }

  // Apparently, we can't trust the output of the xml parser. So let's do our own type
  // validation.
  const feedItemsSchema = z.object({
    id: z.coerce.string(),
    link: z.string().optional(),
    guid: z.string().optional(),
  });

  const feedItems = unparseFeedData.items
    .map((i) => feedItemsSchema.safeParse(i))
    .flatMap((i) => (i.success ? [i.data] : []));

  logger.info(
    `[feed][${jobId}] Found ${feedItems.length} entries in feed "${feed.name}" (${feed.id}) ...`,
  );

  if (feedItems.length === 0) {
    logger.info(`[feed][${jobId}] No entries found.`);
    return;
  }

  // For feeds that don't have guids, use the link as the id
  feedItems.forEach((item) => {
    item.guid = item.guid ?? `${item.id}` ?? item.link;
  });

  const exitingEntries = await db.query.rssFeedImportsTable.findMany({
    where: and(
      eq(rssFeedImportsTable.rssFeedId, feed.id),
      inArray(
        rssFeedImportsTable.entryId,
        feedItems.map((item) => item.guid).filter((id): id is string => !!id),
      ),
    ),
  });

  const newEntries = feedItems.filter(
    (item) =>
      !exitingEntries.some((entry) => entry.entryId === item.guid) &&
      item.link &&
      item.guid,
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
