import { TRPCError } from "@trpc/server";
import { count, eq, sum } from "drizzle-orm";
import { z } from "zod";

import { assets, bookmarkLinks, bookmarks, users } from "@hoarder/db/schema";
import serverConfig from "@hoarder/shared/config";
import {
  LinkCrawlerQueue,
  OpenAIQueue,
  SearchIndexingQueue,
  TidyAssetsQueue,
  triggerSearchReindex,
} from "@hoarder/shared/queues";
import {
  changeRoleSchema,
  resetPasswordSchema,
  zAdminCreateUserSchema,
} from "@hoarder/shared/types/admin";

import { hashPassword } from "../auth";
import { adminProcedure, router } from "../index";
import { createUser } from "./users";

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
  reRunInferenceOnAllBookmarks: adminProcedure
    .input(
      z.object({
        taggingStatus: z.enum(["success", "failure", "all"]),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const bookmarkIds = await ctx.db.query.bookmarks.findMany({
        columns: {
          id: true,
        },
        ...(input.taggingStatus === "all"
          ? {}
          : { where: eq(bookmarks.taggingStatus, input.taggingStatus) }),
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
  createUser: adminProcedure
    .input(zAdminCreateUserSchema)
    .output(
      z.object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
        role: z.enum(["user", "admin"]).nullable(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return createUser(input, ctx, input.role);
    }),
  changeRole: adminProcedure
    .input(changeRoleSchema)
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.id == input.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot change own role",
        });
      }
      const result = await ctx.db
        .update(users)
        .set({ role: input.role })
        .where(eq(users.id, input.userId));

      if (!result.changes) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }
    }),
  resetPassword: adminProcedure
    .input(resetPasswordSchema)
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.id == input.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot reset own password",
        });
      }
      const hashedPassword = await hashPassword(input.newPassword);
      const result = await ctx.db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, input.userId));

      if (result.changes == 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }
    }),
  getAdminNoticies: adminProcedure
    .output(
      z.object({
        legacyContainersNotice: z.boolean(),
      }),
    )
    .query(() => {
      return {
        legacyContainersNotice: serverConfig.usingLegacySeparateContainers,
      };
    }),
});
