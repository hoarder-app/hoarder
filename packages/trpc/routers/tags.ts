import { experimental_trpcMiddleware, TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { bookmarks, bookmarkTags, tagsOnBookmarks } from "@hoarder/db/schema";

import type { Context } from "../index";
import { authedProcedure, router } from "../index";

function conditionFromInput(input: { tagName: string } | { tagId: string }) {
  if ("tagName" in input) {
    return eq(bookmarkTags.name, input.tagName);
  } else {
    return eq(bookmarkTags.id, input.tagId);
  }
}

const ensureTagOwnership = experimental_trpcMiddleware<{
  ctx: Context;
  input: { tagName: string } | { tagId: string };
}>().create(async (opts) => {
  const tag = await opts.ctx.db.query.bookmarkTags.findFirst({
    where: conditionFromInput(opts.input),
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
            conditionFromInput(input),
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
        bookmarks: res.flatMap((t) => t.bookmarkId ? [t.bookmarkId] : []),
      };
    }),
});
