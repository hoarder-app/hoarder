import { experimental_trpcMiddleware, TRPCError } from "@trpc/server";
import { and, eq, inArray, notExists } from "drizzle-orm";
import { z } from "zod";

import type { ZAttachedByEnum } from "@hoarder/shared/types/tags";
import { SqliteError } from "@hoarder/db";
import { bookmarkTags, tagsOnBookmarks } from "@hoarder/db/schema";
import { triggerSearchReindex } from "@hoarder/shared/queues";
import { zGetTagResponseSchema } from "@hoarder/shared/types/tags";

import type { Context } from "../index";
import { authedProcedure, router } from "../index";

function conditionFromInput(input: { tagId: string }, userId: string) {
  return and(eq(bookmarkTags.id, input.tagId), eq(bookmarkTags.userId, userId));
}

const ensureTagOwnership = experimental_trpcMiddleware<{
  ctx: Context;
  input: { tagId: string };
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
      z.object({
        tagId: z.string(),
      }),
    )
    .output(zGetTagResponseSchema)
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
        .where(
          and(
            conditionFromInput(input, ctx.user.id),
            eq(bookmarkTags.userId, ctx.user.id),
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
      z.object({
        tagId: z.string(),
      }),
    )
    .use(ensureTagOwnership)
    .mutation(async ({ input, ctx }) => {
      const affectedBookmarks = await ctx.db
        .select({
          bookmarkId: tagsOnBookmarks.bookmarkId,
        })
        .from(tagsOnBookmarks)
        .where(conditionFromInput(input, ctx.user.id));

      const res = await ctx.db
        .delete(bookmarkTags)
        .where(conditionFromInput(input, ctx.user.id));
      if (res.changes == 0) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      affectedBookmarks.forEach(({ bookmarkId }) =>
        triggerSearchReindex(bookmarkId),
      );
    }),
  deleteUnused: authedProcedure
    .output(
      z.object({
        deletedTags: z.number(),
      }),
    )
    .mutation(async ({ ctx }) => {
      const res = await ctx.db
        .delete(bookmarkTags)
        .where(
          and(
            eq(bookmarkTags.userId, ctx.user.id),
            notExists(
              ctx.db
                .select({ id: tagsOnBookmarks.tagId })
                .from(tagsOnBookmarks)
                .where(eq(tagsOnBookmarks.tagId, bookmarkTags.id)),
            ),
          ),
        );
      return { deletedTags: res.changes };
    }),
  update: authedProcedure
    .input(
      z.object({
        tagId: z.string(),
        name: z.string().optional(),
      }),
    )
    .output(
      z.object({
        id: z.string(),
        name: z.string(),
        userId: z.string(),
        createdAt: z.date(),
      }),
    )
    .use(ensureTagOwnership)
    .mutation(async ({ input, ctx }) => {
      try {
        const res = await ctx.db
          .update(bookmarkTags)
          .set({
            name: input.name,
          })
          .where(
            and(
              eq(bookmarkTags.id, input.tagId),
              eq(bookmarkTags.userId, ctx.user.id),
            ),
          )
          .returning();

        if (res.length == 0) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        try {
          const affectedBookmarks = await ctx.db.query.tagsOnBookmarks.findMany(
            {
              where: eq(tagsOnBookmarks.tagId, input.tagId),
              columns: {
                bookmarkId: true,
              },
            },
          );
          await Promise.all([
            affectedBookmarks
              .map((b) => b.bookmarkId)
              .map((id) => triggerSearchReindex(id)),
          ]);
        } catch (e) {
          // Best Effort attempt to reindex affected bookmarks
          console.error("Failed to reindex affected bookmarks", e);
        }

        return res[0];
      } catch (e) {
        if (e instanceof SqliteError) {
          if (e.code == "SQLITE_CONSTRAINT_UNIQUE") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                "Tag name already exists. You might want to consider a merge instead.",
            });
          }
        }
        throw e;
      }
    }),
  merge: authedProcedure
    .input(
      z.object({
        intoTagId: z.string(),
        fromTagIds: z.array(z.string()),
      }),
    )
    .output(
      z.object({
        mergedIntoTagId: z.string(),
        deletedTags: z.array(z.string()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const requestedTags = new Set([input.intoTagId, ...input.fromTagIds]);
      if (requestedTags.size == 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No tags provided",
        });
      }
      if (input.fromTagIds.includes(input.intoTagId)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot merge tag into itself",
        });
      }
      const affectedTags = await ctx.db.query.bookmarkTags.findMany({
        where: and(
          eq(bookmarkTags.userId, ctx.user.id),
          inArray(bookmarkTags.id, [...requestedTags]),
        ),
        columns: {
          id: true,
          userId: true,
        },
      });
      if (affectedTags.some((t) => t.userId != ctx.user.id)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "User is not allowed to access resource",
        });
      }
      if (affectedTags.length != requestedTags.size) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "One or more tags not found",
        });
      }

      const { deletedTags, affectedBookmarks } = await ctx.db.transaction(
        async (trx) => {
          // Not entirely sure what happens with a racing transaction that adds a to-be-deleted tag on a bookmark. But it's fine for now.

          // NOTE: You can't really do an update here as you might violate the uniquness constraint if the info tag is already attached to the bookmark.
          // There's no OnConflict handling for updates in drizzle.

          // Unlink old tags
          const unlinked = await trx
            .delete(tagsOnBookmarks)
            .where(and(inArray(tagsOnBookmarks.tagId, input.fromTagIds)))
            .returning();

          // Re-attach them to the new tag
          if (unlinked.length > 0) {
            await trx
              .insert(tagsOnBookmarks)
              .values(
                unlinked.map((u) => ({
                  ...u,
                  tagId: input.intoTagId,
                })),
              )
              .onConflictDoNothing();
          }

          // Delete the old tags
          const deletedTags = await trx
            .delete(bookmarkTags)
            .where(
              and(
                inArray(bookmarkTags.id, input.fromTagIds),
                eq(bookmarkTags.userId, ctx.user.id),
              ),
            )
            .returning({ id: bookmarkTags.id });

          return {
            deletedTags,
            affectedBookmarks: unlinked.map((u) => u.bookmarkId),
          };
        },
      );

      try {
        await Promise.all([
          affectedBookmarks.map((id) => triggerSearchReindex(id)),
        ]);
      } catch (e) {
        // Best Effort attempt to reindex affected bookmarks
        console.error("Failed to reindex affected bookmarks", e);
      }

      return {
        deletedTags: deletedTags.map((t) => t.id),
        mergedIntoTagId: input.intoTagId,
      };
    }),
  list: authedProcedure
    .output(
      z.object({
        tags: z.array(zGetTagResponseSchema),
      }),
    )
    .query(async ({ ctx }) => {
      const tags = await ctx.db.query.bookmarkTags.findMany({
        where: eq(bookmarkTags.userId, ctx.user.id),
        with: {
          tagsOnBookmarks: {
            columns: {
              attachedBy: true,
            },
          },
        },
      });

      const resp = tags.map(({ tagsOnBookmarks, ...rest }) => ({
        ...rest,
        count: tagsOnBookmarks.length,
        countAttachedBy: tagsOnBookmarks.reduce<
          Record<ZAttachedByEnum, number>
        >(
          (acc, curr) => {
            if (curr.attachedBy) {
              acc[curr.attachedBy]++;
            }
            return acc;
          },
          { ai: 0, human: 0 },
        ),
      }));

      return { tags: resp };
    }),
});
