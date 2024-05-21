import { count, eq } from "drizzle-orm";
import { z } from "zod";

import { bookmarkLinks, bookmarks, users } from "@hoarder/db/schema";
import {
  LinkCrawlerQueue,
  OpenAIQueue,
  SearchIndexingQueue,
} from "@hoarder/shared/queues";
import {
  AI_PROVIDERS,
  configUpdateSchema,
  dynamicConfigSchema,
} from "@hoarder/shared/types/admin";

import { adminProcedure, router } from "../index";

export const adminAppRouter = router({
  updateConfig: adminProcedure
    .input(dynamicConfigSchema.partial())
    .output(configUpdateSchema)
    .mutation(({ input }) => {
      console.log("asdfasdf", JSON.stringify(input));

      //throw new TRPCError({
      //  message: "qwerqwer",
      //  code: "FORBIDDEN",
      //});
      return {
        successful: true,
      };
    }),
  getConfig: adminProcedure.output(dynamicConfigSchema).query(() => {
    // TODO check permissions ?
    return {
      generalSettings: {
        disableNewReleaseCheck: true,
        disableSignups: true,
        maxAssetSize: 4,
      },
      aiConfig: {
        aiProvider: AI_PROVIDERS.OLLAMA,
        Ollama: {
          baseURL: "http://www.google.at",
          inferenceImageModel: "llama3",
          inferenceLanguage: "english",
          inferenceTextModel: "text",
        },
      },
      crawlerConfig: {
        downloadBannerImage: false,
        storeScreenshot: true,
        storeFullPageScreenshot: false,
        jobTimeout: 60000,
        navigateTimeout: 60000,
      },
    };
  }),
  stats: adminProcedure
    .output(
      z.object({
        numUsers: z.number(),
        numBookmarks: z.number(),
        crawlStats: z.object({
          queuedInRedis: z.number(),
          pending: z.number(),
          failed: z.number(),
        }),
        inferenceStats: z.object({
          queuedInRedis: z.number(),
          pending: z.number(),
          failed: z.number(),
        }),
        indexingStats: z.object({
          queuedInRedis: z.number(),
        }),
      }),
    )
    .query(async ({ ctx }) => {
      const [
        [{ value: numUsers }],
        [{ value: numBookmarks }],

        // Crawls
        pendingCrawlsInRedis,
        [{ value: pendingCrawls }],
        [{ value: failedCrawls }],

        // Indexing
        pendingIndexingInRedis,

        // Inference
        pendingInferenceInRedis,
        [{ value: pendingInference }],
        [{ value: failedInference }],
      ] = await Promise.all([
        ctx.db.select({ value: count() }).from(users),
        ctx.db.select({ value: count() }).from(bookmarks),

        // Crawls
        LinkCrawlerQueue.getWaitingCount(),
        ctx.db
          .select({ value: count() })
          .from(bookmarkLinks)
          .where(eq(bookmarkLinks.crawlStatus, "pending")),
        ctx.db
          .select({ value: count() })
          .from(bookmarkLinks)
          .where(eq(bookmarkLinks.crawlStatus, "failure")),

        // Indexing
        SearchIndexingQueue.getWaitingCount(),

        // Inference
        OpenAIQueue.getWaitingCount(),
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
          queuedInRedis: pendingCrawlsInRedis,
          pending: pendingCrawls,
          failed: failedCrawls,
        },
        inferenceStats: {
          queuedInRedis: pendingInferenceInRedis,
          pending: pendingInference,
          failed: failedInference,
        },
        indexingStats: {
          queuedInRedis: pendingIndexingInRedis,
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
          LinkCrawlerQueue.add("crawl", {
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

    await Promise.all(
      bookmarkIds.map((b) =>
        SearchIndexingQueue.add("search_indexing", {
          bookmarkId: b.id,
          type: "index",
        }),
      ),
    );
  }),
});
