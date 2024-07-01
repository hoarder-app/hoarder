import assert from "node:assert";
import { experimental_trpcMiddleware, TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { SqliteError } from "@hoarder/db";
import { bookmarkLists, bookmarksInLists } from "@hoarder/db/schema";
import { zBookmarkListSchema } from "@hoarder/shared/types/lists";

import type { Context } from "../index";
import { authedProcedure, router } from "../index";
import { ensureBookmarkOwnership } from "./bookmarks";

const zNewBookmarkListSchema = z.object({
  name: z
    .string()
    .min(1, "List name can't be empty")
    .max(40, "List name is at most 40 chars"),
  icon: z.string(),
  parentId: z.string().nullish(),
});

export const ensureListOwnership = experimental_trpcMiddleware<{
  ctx: Context;
  input: { listId: string };
}>().create(async (opts) => {
  const list = await opts.ctx.db.query.bookmarkLists.findFirst({
    where: eq(bookmarkLists.id, opts.input.listId),
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
  if (!list) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "List not found",
    });
  }
  if (list.userId != opts.ctx.user.id) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "User is not allowed to access resource",
    });
  }

  return opts.next();
});

export const listsAppRouter = router({
  create: authedProcedure
    .input(zNewBookmarkListSchema)
    .output(zBookmarkListSchema)
    .mutation(async ({ input, ctx }) => {
      const [result] = await ctx.db
        .insert(bookmarkLists)
        .values({
          name: input.name,
          icon: input.icon,
          userId: ctx.user.id,
          parentId: input.parentId,
        })
        .returning();
      return result;
    }),
  edit: authedProcedure
    .input(
      zNewBookmarkListSchema
        .partial()
        .merge(z.object({ listId: z.string() }))
        .refine((val) => val.parentId != val.listId, {
          message: "List can't be its own parent",
          path: ["parentId"],
        }),
    )
    .output(zBookmarkListSchema)
    .mutation(async ({ input, ctx }) => {
      const result = await ctx.db
        .update(bookmarkLists)
        .set({
          name: input.name,
          icon: input.icon,
          parentId: input.parentId,
        })
        .where(
          and(
            eq(bookmarkLists.id, input.listId),
            eq(bookmarkLists.userId, ctx.user.id),
          ),
        )
        .returning();
      if (result.length == 0) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return result[0];
    }),
  delete: authedProcedure
    .input(
      z.object({
        listId: z.string(),
      }),
    )
    .use(ensureListOwnership)
    .mutation(async ({ input, ctx }) => {
      const res = await ctx.db
        .delete(bookmarkLists)
        .where(
          and(
            eq(bookmarkLists.id, input.listId),
            eq(bookmarkLists.userId, ctx.user.id),
          ),
        );
      if (res.changes == 0) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
    }),
  addToList: authedProcedure
    .input(
      z.object({
        listId: z.string(),
        bookmarkId: z.string(),
      }),
    )
    .use(ensureListOwnership)
    .use(ensureBookmarkOwnership)
    .mutation(async ({ input, ctx }) => {
      try {
        await ctx.db.insert(bookmarksInLists).values({
          listId: input.listId,
          bookmarkId: input.bookmarkId,
        });
      } catch (e) {
        if (e instanceof SqliteError) {
          if (e.code == "SQLITE_CONSTRAINT_PRIMARYKEY") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Bookmark ${input.bookmarkId} is already in the list ${input.listId}`,
            });
          }
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong",
        });
      }
    }),
  removeFromList: authedProcedure
    .input(
      z.object({
        listId: z.string(),
        bookmarkId: z.string(),
      }),
    )
    .use(ensureListOwnership)
    .use(ensureBookmarkOwnership)
    .mutation(async ({ input, ctx }) => {
      const deleted = await ctx.db
        .delete(bookmarksInLists)
        .where(
          and(
            eq(bookmarksInLists.listId, input.listId),
            eq(bookmarksInLists.bookmarkId, input.bookmarkId),
          ),
        );
      if (deleted.changes == 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Bookmark ${input.bookmarkId} is already not in list ${input.listId}`,
        });
      }
    }),
  get: authedProcedure
    .input(
      z.object({
        listId: z.string(),
      }),
    )
    .output(
      zBookmarkListSchema.merge(
        z.object({
          bookmarks: z.array(z.string()),
        }),
      ),
    )
    .use(ensureListOwnership)
    .query(async ({ input, ctx }) => {
      const res = await ctx.db.query.bookmarkLists.findFirst({
        where: and(
          eq(bookmarkLists.id, input.listId),
          eq(bookmarkLists.userId, ctx.user.id),
        ),
        with: {
          bookmarksInLists: true,
        },
      });
      if (!res) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return {
        id: res.id,
        name: res.name,
        icon: res.icon,
        parentId: res.parentId,
        bookmarks: res.bookmarksInLists.map((b) => b.bookmarkId),
      };
    }),
  list: authedProcedure
    .output(
      z.object({
        lists: z.array(zBookmarkListSchema),
      }),
    )
    .query(async ({ ctx }) => {
      const lists = await ctx.db.query.bookmarkLists.findMany({
        where: and(eq(bookmarkLists.userId, ctx.user.id)),
      });

      return { lists };
    }),
  getListsOfBookmark: authedProcedure
    .input(z.object({ bookmarkId: z.string() }))
    .output(
      z.object({
        lists: z.array(zBookmarkListSchema),
      }),
    )
    .use(ensureBookmarkOwnership)
    .query(async ({ input, ctx }) => {
      const lists = await ctx.db.query.bookmarksInLists.findMany({
        where: and(eq(bookmarksInLists.bookmarkId, input.bookmarkId)),
        with: {
          list: true,
        },
      });
      assert(lists.map((l) => l.list.userId).every((id) => id == ctx.user.id));

      return { lists: lists.map((l) => l.list) };
    }),
});
