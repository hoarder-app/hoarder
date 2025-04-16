import { experimental_trpcMiddleware, TRPCError } from "@trpc/server";
import { and, desc, eq, lt, lte, or } from "drizzle-orm";
import { z } from "zod";

import { highlights } from "@karakeep/db/schema";
import {
  DEFAULT_NUM_HIGHLIGHTS_PER_PAGE,
  zGetAllHighlightsResponseSchema,
  zHighlightSchema,
  zNewHighlightSchema,
  zUpdateHighlightSchema,
} from "@karakeep/shared/types/highlights";
import { zCursorV2 } from "@karakeep/shared/types/pagination";

import { authedProcedure, Context, router } from "../index";
import { ensureBookmarkOwnership } from "./bookmarks";

const ensureHighlightOwnership = experimental_trpcMiddleware<{
  ctx: Context;
  input: { highlightId: string };
}>().create(async (opts) => {
  const highlight = await opts.ctx.db.query.highlights.findFirst({
    where: eq(highlights.id, opts.input.highlightId),
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
  if (!highlight) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Highlight not found",
    });
  }
  if (highlight.userId != opts.ctx.user.id) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "User is not allowed to access resource",
    });
  }

  return opts.next();
});

export const highlightsAppRouter = router({
  create: authedProcedure
    .input(zNewHighlightSchema)
    .output(zHighlightSchema)
    .use(ensureBookmarkOwnership)
    .mutation(async ({ input, ctx }) => {
      const [result] = await ctx.db
        .insert(highlights)
        .values({
          bookmarkId: input.bookmarkId,
          startOffset: input.startOffset,
          endOffset: input.endOffset,
          color: input.color,
          text: input.text,
          note: input.note,
          userId: ctx.user.id,
        })
        .returning();
      return result;
    }),
  getForBookmark: authedProcedure
    .input(z.object({ bookmarkId: z.string() }))
    .output(z.object({ highlights: z.array(zHighlightSchema) }))
    .use(ensureBookmarkOwnership)
    .query(async ({ input, ctx }) => {
      const results = await ctx.db.query.highlights.findMany({
        where: and(
          eq(highlights.bookmarkId, input.bookmarkId),
          eq(highlights.userId, ctx.user.id),
        ),
        orderBy: [desc(highlights.createdAt), desc(highlights.id)],
      });
      return { highlights: results };
    }),
  get: authedProcedure
    .input(z.object({ highlightId: z.string() }))
    .output(zHighlightSchema)
    .use(ensureHighlightOwnership)
    .query(async ({ input, ctx }) => {
      const result = await ctx.db.query.highlights.findFirst({
        where: and(
          eq(highlights.id, input.highlightId),
          eq(highlights.userId, ctx.user.id),
        ),
      });
      if (!result) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return result;
    }),
  getAll: authedProcedure
    .input(
      z.object({
        cursor: zCursorV2.nullish(),
        limit: z.number().optional().default(DEFAULT_NUM_HIGHLIGHTS_PER_PAGE),
      }),
    )
    .output(zGetAllHighlightsResponseSchema)
    .query(async ({ input, ctx }) => {
      const results = await ctx.db.query.highlights.findMany({
        where: and(
          eq(highlights.userId, ctx.user.id),
          input.cursor
            ? or(
                lt(highlights.createdAt, input.cursor.createdAt),
                and(
                  eq(highlights.createdAt, input.cursor.createdAt),
                  lte(highlights.id, input.cursor.id),
                ),
              )
            : undefined,
        ),
        limit: input.limit + 1,
        orderBy: [desc(highlights.createdAt), desc(highlights.id)],
      });
      let nextCursor: z.infer<typeof zCursorV2> | null = null;
      if (results.length > input.limit) {
        const nextItem = results.pop()!;
        nextCursor = {
          id: nextItem.id,
          createdAt: nextItem.createdAt,
        };
      }
      return {
        highlights: results,
        nextCursor,
      };
    }),
  delete: authedProcedure
    .input(z.object({ highlightId: z.string() }))
    .output(zHighlightSchema)
    .use(ensureHighlightOwnership)
    .mutation(async ({ input, ctx }) => {
      const result = await ctx.db
        .delete(highlights)
        .where(
          and(
            eq(highlights.id, input.highlightId),
            eq(highlights.userId, ctx.user.id),
          ),
        )
        .returning();
      if (result.length == 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }
      return result[0];
    }),
  update: authedProcedure
    .input(zUpdateHighlightSchema)
    .output(zHighlightSchema)
    .use(ensureHighlightOwnership)
    .mutation(async ({ input, ctx }) => {
      const result = await ctx.db
        .update(highlights)
        .set({
          color: input.color,
        })
        .where(
          and(
            eq(highlights.id, input.highlightId),
            eq(highlights.userId, ctx.user.id),
          ),
        )
        .returning();
      if (result.length == 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }
      return result[0];
    }),
});
