import { experimental_trpcMiddleware, TRPCError } from "@trpc/server";
import { and, count, eq } from "drizzle-orm";
import { z } from "zod";

import { bookmarks, bookmarkTags, tagsOnBookmarks } from "@hoarder/db/schema";

import type { Context } from "../index";
import { authedProcedure, router } from "../index";

function conditionFromInput(
  input: { tagName: string } | { tagId: string },
  userId: string,
) {
  if ("tagName" in input) {
    // Tag names are not unique, we must include userId in the condition
    return and(
      eq(bookmarkTags.name, input.tagName),
      eq(bookmarkTags.userId, userId),
    );
  } else {
    return eq(bookmarkTags.id, input.tagId);
  }
}

const ensureTagOwnership = experimental_trpcMiddleware<{
  ctx: Context;
  input: { tagName: string } | { tagId: string };
}>().create(async (opts) => {
  if (!opts.ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "User is not authorized",
    });
  }
  const tag = await opts.ctx.db.query.bookmarkTags.findFirst({
    where: conditionFromInput(opts.input, opts.ctx.user.id),
    columns: {
      userId: true,
    },
  });

  if (!tag) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Tag not found",
    });
  }
  if (tag.userId != opts.ctx.user.id) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "User is not allowed to access resource",
    });
  }

  return opts.next();
});

export const tagsAppRouter = router({
  get: authedProcedure
    .input(
      z
        .object({
          tagId: z.string(),
        })
        .or(
          z.object({
            tagName: z.string(),
          }),
        ),
    )
    .output(
      z.object({
        id: z.string(),
        name: z.string(),
        bookmarks: z.array(z.string()),
      }),
    )
    .use(ensureTagOwnership)
    .query(async ({ input, ctx }) => {
      const res = await ctx.db
        .select({
          id: bookmarkTags.id,
          name: bookmarkTags.name,
          bookmarkId: bookmarks.id,
        })
        .from(bookmarkTags)
        .leftJoin(tagsOnBookmarks, eq(bookmarkTags.id, tagsOnBookmarks.tagId))
        .leftJoin(bookmarks, eq(tagsOnBookmarks.bookmarkId, bookmarks.id))
        .where(
          and(
            conditionFromInput(input, ctx.user.id),
            eq(bookmarkTags.userId, ctx.user.id),
            eq(bookmarks.archived, false),
          ),
        );

      if (res.length == 0) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return {
        id: res[0].id,
        name: res[0].name,
        bookmarks: res.flatMap((t) => (t.bookmarkId ? [t.bookmarkId] : [])),
      };
    }),
  list: authedProcedure
    .output(
      z.object({
        tags: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            count: z.number(),
          }),
        ),
      }),
    )
    .query(async ({ ctx }) => {
      const tags = await ctx.db
        .select({
          id: tagsOnBookmarks.tagId,
          name: bookmarkTags.name,
          count: count(),
        })
        .from(tagsOnBookmarks)
        .where(eq(bookmarkTags.userId, ctx.user.id))
        .groupBy(tagsOnBookmarks.tagId)
        .innerJoin(bookmarkTags, eq(bookmarkTags.id, tagsOnBookmarks.tagId));
      return { tags };
    }),
});
