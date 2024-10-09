import { count, eq } from "drizzle-orm";
import { z } from "zod";

import {
  ConfigKeys,
  ConfigSectionName,
  serverConfig,
} from "@hoarder/db/config/config";
import {
  deleteConfigValue,
  getConfigValueFromDB,
  storeConfigValue,
} from "@hoarder/db/config/configDatabaseUtils";
import { bookmarkLinks, bookmarks, users } from "@hoarder/db/schema";
import {
  LinkCrawlerQueue,
  OpenAIQueue,
  SearchIndexingQueue,
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
  getConfig: adminProcedure
    .output(
      z.record(
        z.string(),
        z.record(z.string(), z.union([z.boolean(), z.number(), z.string()])),
      ),
    )
    .query(async () => {
      console.log("retrieving config");
      const returnValue: Record<
        string,
        Record<string, boolean | string | number>
      > = {};
      for (const configSectionName of Object.values(ConfigSectionName)) {
        const values: Record<string, boolean | string | number> = {};
        const configSubSection = serverConfig[configSectionName];
        for (const key in configSubSection) {
          values[key] = await getConfigValueFromDB(configSubSection[key]);
        }
        returnValue[configSectionName] = values;
      }
      return returnValue;
    }),
  storeConfig: adminProcedure
    .input(
      z.object({
        configSectionName: z.nativeEnum(ConfigSectionName),
        values: z.record(
          z.nativeEnum(ConfigKeys),
          z.union([z.boolean(), z.number(), z.string()]),
        ),
      }),
    )
    .mutation(async ({ input }) => {
      const configSection = serverConfig[input.configSectionName];
      const values = input.values;

      // Fill the default value into the config for everything that was not provided (=all the hidden fields, so we need to reset them)
      for (const [configKey, configValue] of Object.entries(configSection)) {
        // Value is available to store --> store
        if (configKey in values) {
          await storeConfigValue(configValue, values[configKey as ConfigKeys]!);
        } else {
          // Value is not available --> delete from the config again. This prevents validation errors and keeps the db clean
          await deleteConfigValue(configValue);
        }
      }
    }),
});
