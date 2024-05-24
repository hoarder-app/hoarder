import { count, eq } from "drizzle-orm";
import { z } from "zod";

import { getDynamicConfig } from "@hoarder/db/dynamicConfig";
import {
  bookmarkLinks,
  bookmarks,
  serverConfig,
  users,
} from "@hoarder/db/schema";
import {
  LinkCrawlerQueue,
  OpenAIQueue,
  SearchIndexingQueue,
} from "@hoarder/shared/queues";
import {
  configUpdateSchema,
  dynamicConfigSchema,
} from "@hoarder/shared/types/admin";

import { adminProcedure, router } from "../index";

interface IterationResult {
  path: string;
  value: string;
  type: "string" | "boolean" | "number";
}

function getType(value: unknown): "string" | "boolean" | "number" {
  const type = typeof value;
  if (type === "string" || type === "number" || type === "boolean") {
    return type;
  }
  throw new Error(`Invalid type ${type}`);
}

// Recursive function to handle nested properties
function* iterate(
  obj: Record<string, unknown>,
  stack: string[] = [],
): Generator<IterationResult> {
  for (const property in obj) {
    if (
      Object.prototype.hasOwnProperty.call(obj, property) &&
      property in obj
    ) {
      const value = obj[property];
      if (value && typeof value === "object" && !Array.isArray(value)) {
        yield* iterate(
          value as Record<string, unknown>,
          stack.concat(property),
        );
      } else {
        yield {
          path: stack.concat(property).join("."),
          value: String(value),
          type: getType(value),
        };
      }
    }
  }
}

export const adminAppRouter = router({
  updateConfig: adminProcedure
    .input(dynamicConfigSchema.partial())
    .output(configUpdateSchema)
    .mutation(async ({ input, ctx }) => {
      console.log("input", input);
      await ctx.db.transaction(async (transaction) => {
        for (const { path, value, type } of iterate(input)) {
          console.log("trying to insert: ", path, value, type);
          const configRow = {
            key: path,
            value: value,
            type: type,
          };

          // Insert into database
          await transaction
            .insert(serverConfig)
            .values(configRow)
            .onConflictDoUpdate({
              target: serverConfig.key,
              set: { ...configRow },
            });
        }
      });
      return {
        successful: true,
      };
    }),
  getConfig: adminProcedure.output(dynamicConfigSchema).query(async () => {
    // TODO check permissions ?

    return await getDynamicConfig();
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
