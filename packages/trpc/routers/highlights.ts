import { experimental_trpcMiddleware, TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { highlights } from "@hoarder/db/schema";
import {
  zHighlightSchema,
  zNewHighlightSchema,
  zUpdateHighlightSchema,
} from "@hoarder/shared/types/highlights";

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
      message: "Bookmark not found",
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
      });
      return { highlights: results };
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
