import { count, eq, sum } from "drizzle-orm";
import { z } from "zod";

import { assets, bookmarkLinks, bookmarks, users } from "@hoarder/db/schema";
import {
  LinkCrawlerQueue,
  OpenAIQueue,
  SearchIndexingQueue,
  TidyAssetsQueue,
  triggerSearchReindex,
} from "@hoarder/shared/queues";

import { adminProcedure, router } from "../index";

export const adminAppRouter = router({
  stats: adminProcedure
    .output(
      z.object({
        numUsers: z.number(),
        numBookmarks: z.number(),
        crawlStats: z.object({
          queued: z.number(),
          pending: z.number(),
          failed: z.number(),
        }),
        inferenceStats: z.object({
          queued: z.number(),
          pending: z.number(),
          failed: z.number(),
        }),
        indexingStats: z.object({
          queued: z.number(),
        }),
        tidyAssetsStats: z.object({
          queued: z.number(),
        }),
      }),
    )
    .query(async ({ ctx }) => {
      const [
        [{ value: numUsers }],
        [{ value: numBookmarks }],

        // Crawls
        queuedCrawls,
        [{ value: pendingCrawls }],
        [{ value: failedCrawls }],

        // Indexing
        queuedIndexing,

        // Inference
        queuedInferences,
        [{ value: pendingInference }],
        [{ value: failedInference }],

        // Tidy Assets
        queuedTidyAssets,
      ] = await Promise.all([
        ctx.db.select({ value: count() }).from(users),
        ctx.db.select({ value: count() }).from(bookmarks),

        // Crawls
        LinkCrawlerQueue.stats(),
        ctx.db
          .select({ value: count() })
          .from(bookmarkLinks)
          .where(eq(bookmarkLinks.crawlStatus, "pending")),
        ctx.db
          .select({ value: count() })
          .from(bookmarkLinks)
          .where(eq(bookmarkLinks.crawlStatus, "failure")),

        // Indexing
        SearchIndexingQueue.stats(),

        // Inference
        OpenAIQueue.stats(),
        ctx.db
          .select({ value: count() })
          .from(bookmarks)
          .where(eq(bookmarks.taggingStatus, "pending")),
        ctx.db
          .select({ value: count() })
          .from(bookmarks)
          .where(eq(bookmarks.taggingStatus, "failure")),

        // Tidy Assets
        TidyAssetsQueue.stats(),
      ]);

      return {
        numUsers,
        numBookmarks,
        crawlStats: {
          queued: queuedCrawls.pending + queuedCrawls.pending_retry,
          pending: pendingCrawls,
          failed: failedCrawls,
        },
        inferenceStats: {
          queued: queuedInferences.pending + queuedInferences.pending_retry,
          pending: pendingInference,
          failed: failedInference,
        },
        indexingStats: {
          queued: queuedIndexing.pending + queuedIndexing.pending_retry,
        },
        tidyAssetsStats: {
          queued: queuedTidyAssets.pending + queuedTidyAssets.pending_retry,
        },
      };
    }),
  recrawlLinks: adminProcedure
    .input(
      z.object({
        crawlStatus: z.enum(["success", "failure", "all"]),
        runInference: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const bookmarkIds = await ctx.db.query.bookmarkLinks.findMany({
        columns: {
          id: true,
        },
        ...(input.crawlStatus === "all"
          ? {}
          : { where: eq(bookmarkLinks.crawlStatus, input.crawlStatus) }),
      });

      await Promise.all(
        bookmarkIds.map((b) =>
          LinkCrawlerQueue.enqueue({
            bookmarkId: b.id,
            runInference: input.runInference,
          }),
        ),
      );
    }),
  reindexAllBookmarks: adminProcedure.mutation(async ({ ctx }) => {
    const bookmarkIds = await ctx.db.query.bookmarks.findMany({
      columns: {
        id: true,
      },
    });

    await Promise.all(bookmarkIds.map((b) => triggerSearchReindex(b.id)));
  }),
  reRunInferenceOnAllBookmarks: adminProcedure.mutation(async ({ ctx }) => {
    const bookmarkIds = await ctx.db.query.bookmarks.findMany({
      columns: {
        id: true,
      },
    });

    await Promise.all(
      bookmarkIds.map((b) => OpenAIQueue.enqueue({ bookmarkId: b.id })),
    );
  }),
  tidyAssets: adminProcedure.mutation(async () => {
    await TidyAssetsQueue.enqueue({
      cleanDanglingAssets: true,
      syncAssetMetadata: true,
    });
  }),
  userStats: adminProcedure
    .output(
      z.record(
        z.string(),
        z.object({
          numBookmarks: z.number(),
          assetSizes: z.number(),
        }),
      ),
    )
    .query(async ({ ctx }) => {
      const [userIds, bookmarkStats, assetStats] = await Promise.all([
        ctx.db.select({ id: users.id }).from(users),
        ctx.db
          .select({ id: bookmarks.userId, value: count() })
          .from(bookmarks)
          .groupBy(bookmarks.userId),
        ctx.db
          .select({ id: assets.userId, value: sum(assets.size) })
          .from(assets)
          .groupBy(assets.userId),
      ]);

      const results: Record<
        string,
        { numBookmarks: number; assetSizes: number }
      > = {};
      for (const user of userIds) {
        results[user.id] = {
          numBookmarks: 0,
          assetSizes: 0,
        };
      }
      for (const stat of bookmarkStats) {
        results[stat.id].numBookmarks = stat.value;
      }
      for (const stat of assetStats) {
        results[stat.id].assetSizes = parseInt(stat.value ?? "0");
      }

      return results;
    }),
});
