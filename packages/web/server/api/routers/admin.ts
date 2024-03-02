import { adminProcedure, router } from "../trpc";
import { z } from "zod";
import { count } from "drizzle-orm";
import { bookmarks, users } from "@hoarder/db/schema";
import {
  LinkCrawlerQueue,
  OpenAIQueue,
  SearchIndexingQueue,
} from "@hoarder/shared/queues";

export const adminAppRouter = router({
  stats: adminProcedure
    .output(
      z.object({
        numUsers: z.number(),
        numBookmarks: z.number(),
        pendingCrawls: z.number(),
        pendingIndexing: z.number(),
        pendingOpenai: z.number(),
      }),
    )
    .query(async ({ ctx }) => {
      const [
        [{ value: numUsers }],
        [{ value: numBookmarks }],
        pendingCrawls,
        pendingIndexing,
        pendingOpenai,
      ] = await Promise.all([
        ctx.db.select({ value: count() }).from(users),
        ctx.db.select({ value: count() }).from(bookmarks),
        LinkCrawlerQueue.getWaitingCount(),
        SearchIndexingQueue.getWaitingCount(),
        OpenAIQueue.getWaitingCount(),
      ]);

      return {
        numUsers,
        numBookmarks,
        pendingCrawls,
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
