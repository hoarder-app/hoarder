import { experimental_trpcMiddleware, TRPCError } from "@trpc/server";
import { and, count, eq } from "drizzle-orm";
import { z } from "zod";

import { bookmarks, bookmarkTags, tagsOnBookmarks } from "@hoarder/db/schema";

import type { Context } from "../index";
import type { ZAttachedByEnum } from "../types/tags";
import { authedProcedure, router } from "../index";
import { zAttachedByEnumSchema } from "../types/tags";

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

const zTagSchema = z.object({
  id: z.string(),
  name: z.string(),
  count: z.number(),
  countAttachedBy: z.record(zAttachedByEnumSchema, z.number()),
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
    .output(zTagSchema)
    .use(ensureTagOwnership)
    .query(async ({ input, ctx }) => {
      const res = await ctx.db
        .select({
          id: bookmarkTags.id,
          name: bookmarkTags.name,
          attachedBy: tagsOnBookmarks.attachedBy,
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

      const countAttachedBy = res.reduce<Record<ZAttachedByEnum, number>>(
        (acc, curr) => {
          if (curr.attachedBy) {
            acc[curr.attachedBy]++;
          }
          return acc;
        },
        { ai: 0, human: 0 },
      );

      return {
        id: res[0].id,
        name: res[0].name,
        count: Object.values(countAttachedBy).reduce((s, a) => s + a, 0),
        countAttachedBy,
      };
    }),
  delete: authedProcedure
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
    .use(ensureTagOwnership)
    .mutation(async ({ input, ctx }) => {
      const res = await ctx.db
        .delete(bookmarkTags)
        .where(
          and(
            conditionFromInput(input, ctx.user.id),
            eq(bookmarkTags.userId, ctx.user.id),
          ),
        );
      if (res.changes == 0) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
    }),
  list: authedProcedure
    .output(
      z.object({
        tags: z.array(zTagSchema),
      }),
    )
    .query(async ({ ctx }) => {
      const res = await ctx.db
        .select({
          id: tagsOnBookmarks.tagId,
          name: bookmarkTags.name,
          attachedBy: tagsOnBookmarks.attachedBy,
          count: count(),
        })
        .from(tagsOnBookmarks)
        .groupBy(tagsOnBookmarks.tagId, tagsOnBookmarks.attachedBy)
        .innerJoin(bookmarkTags, eq(bookmarkTags.id, tagsOnBookmarks.tagId))
        .leftJoin(bookmarks, eq(tagsOnBookmarks.bookmarkId, bookmarks.id))
        .where(
          and(
            eq(bookmarkTags.userId, ctx.user.id),
            eq(bookmarks.archived, false),
          ),
        );

      const tags = res.reduce<Record<string, z.infer<typeof zTagSchema>>>(
        (acc, row) => {
          if (!(row.id in acc)) {
            acc[row.id] = {
              id: row.id,
              name: row.name,
              count: 0,
              countAttachedBy: {
                ai: 0,
                human: 0,
              },
            };
          }
          acc[row.id].count++;
          acc[row.id].countAttachedBy[row.attachedBy]!++;
          return acc;
        },
        {},
      );
      return { tags: Object.values(tags) };
    }),
});
