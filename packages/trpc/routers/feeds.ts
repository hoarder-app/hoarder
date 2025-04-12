import { experimental_trpcMiddleware, TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { rssFeedsTable } from "@karakeep/db/schema";
import { FeedQueue } from "@karakeep/shared/queues";
import {
  zFeedSchema,
  zNewFeedSchema,
  zUpdateFeedSchema,
} from "@karakeep/shared/types/feeds";

import { authedProcedure, Context, router } from "../index";

export const ensureFeedOwnership = experimental_trpcMiddleware<{
  ctx: Context;
  input: { feedId: string };
}>().create(async (opts) => {
  const feed = await opts.ctx.db.query.rssFeedsTable.findFirst({
    where: eq(rssFeedsTable.id, opts.input.feedId),
    columns: {
      userId: true,
    },
  });
  if (!opts.ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "User is not authorized",
    });
  }
  if (!feed) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Feed not found",
    });
  }
  if (feed.userId != opts.ctx.user.id) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "User is not allowed to access resource",
    });
  }

  return opts.next();
});

export const feedsAppRouter = router({
  create: authedProcedure
    .input(zNewFeedSchema)
    .output(zFeedSchema)
    .mutation(async ({ input, ctx }) => {
      const [feed] = await ctx.db
        .insert(rssFeedsTable)
        .values({
          name: input.name,
          url: input.url,
          userId: ctx.user.id,
        })
        .returning();
      return feed;
    }),
  update: authedProcedure
    .input(zUpdateFeedSchema)
    .output(zFeedSchema)
    .use(ensureFeedOwnership)
    .mutation(async ({ input, ctx }) => {
      const feed = await ctx.db
        .update(rssFeedsTable)
        .set({
          name: input.name,
          url: input.url,
        })
        .where(
          and(
            eq(rssFeedsTable.userId, ctx.user.id),
            eq(rssFeedsTable.id, input.feedId),
          ),
        )
        .returning();
      if (feed.length == 0) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return feed[0];
    }),
  get: authedProcedure
    .input(
      z.object({
        feedId: z.string(),
      }),
    )
    .output(zFeedSchema)
    .use(ensureFeedOwnership)
    .query(async ({ ctx, input }) => {
      const feed = await ctx.db.query.rssFeedsTable.findFirst({
        where: and(
          eq(rssFeedsTable.userId, ctx.user.id),
          eq(rssFeedsTable.id, input.feedId),
        ),
      });
      if (!feed) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return feed;
    }),
  list: authedProcedure
    .output(z.object({ feeds: z.array(zFeedSchema) }))
    .query(async ({ ctx }) => {
      const feeds = await ctx.db.query.rssFeedsTable.findMany({
        where: eq(rssFeedsTable.userId, ctx.user.id),
      });
      return { feeds };
    }),
  delete: authedProcedure
    .input(
      z.object({
        feedId: z.string(),
      }),
    )
    .use(ensureFeedOwnership)
    .mutation(async ({ input, ctx }) => {
      const res = await ctx.db
        .delete(rssFeedsTable)
        .where(
          and(
            eq(rssFeedsTable.userId, ctx.user.id),
            eq(rssFeedsTable.id, input.feedId),
          ),
        );
      if (res.changes == 0) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
    }),
  fetchNow: authedProcedure
    .input(z.object({ feedId: z.string() }))
    .use(ensureFeedOwnership)
    .mutation(async ({ input }) => {
      await FeedQueue.enqueue({
        feedId: input.feedId,
      });
    }),
});
