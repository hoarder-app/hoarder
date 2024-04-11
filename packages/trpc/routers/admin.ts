import { count, eq } from "drizzle-orm";
import { z } from "zod";

import { bookmarkLinks, bookmarks, users } from "@hoarder/db/schema";
import {
  LinkCrawlerQueue,
  OpenAIQueue,
  SearchIndexingQueue,
} from "@hoarder/shared/queues";

import { adminProcedure, router } from "../index";

export const adminAppRouter = router({
  stats: adminProcedure
    .output(
      z.object({
        numUsers: z.number(),
        numBookmarks: z.number(),
        pendingCrawls: z.number(),
        failedCrawls: z.number(),
        pendingIndexing: z.number(),
        pendingOpenai: z.number(),
      }),
    )
    .query(async ({ ctx }) => {
      const [
        [{ value: numUsers }],
        [{ value: numBookmarks }],
        [{ value: pendingCrawls }],
        [{ value: failedCrawls }],
        pendingIndexing,
        pendingOpenai,
      ] = await Promise.all([
        ctx.db.select({ value: count() }).from(users),
        ctx.db.select({ value: count() }).from(bookmarks),
        ctx.db
          .select({ value: count() })
          .from(bookmarkLinks)
          .where(eq(bookmarkLinks.crawlStatus, "pending")),
        ctx.db
          .select({ value: count() })
          .from(bookmarkLinks)
          .where(eq(bookmarkLinks.crawlStatus, "failure")),
        SearchIndexingQueue.getWaitingCount(),
        OpenAIQueue.getWaitingCount(),
      ]);

      return {
        numUsers,
        numBookmarks,
        pendingCrawls,
        failedCrawls,
        pendingIndexing,
        pendingOpenai,
      };
    }),
  recrawlAllLinks: adminProcedure.mutation(async ({ ctx }) => {
    const bookmarkIds = await ctx.db.query.bookmarkLinks.findMany({
      columns: {
        id: true,
      },
    });

    await Promise.all(
      bookmarkIds.map((b) =>
        LinkCrawlerQueue.add("crawl", {
          bookmarkId: b.id,
        }),
      ),
    );
  }),
  recrawlFailedLinks: adminProcedure.mutation(async ({ ctx }) => {
    const bookmarkIds = await ctx.db.query.bookmarkLinks.findMany({
      columns: {
        id: true,
      },
      where: eq(bookmarkLinks.crawlStatus, "failure"),
    });
    await Promise.all(
      bookmarkIds.map((b) =>
        LinkCrawlerQueue.add("crawl", {
          bookmarkId: b.id,
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
