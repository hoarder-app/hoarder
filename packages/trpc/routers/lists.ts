import { Context, authedProcedure, router } from "../index";
import { SqliteError } from "@hoarder/db";
import { z } from "zod";
import { TRPCError, experimental_trpcMiddleware } from "@trpc/server";
import { bookmarkLists, bookmarksInLists } from "@hoarder/db/schema";
import { and, eq } from "drizzle-orm";
import { zBookmarkListSchema } from "../types/lists";

const ensureListOwnership = experimental_trpcMiddleware<{
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
    .input(
      z.object({
        name: z.string().min(1).max(20),
        icon: z.string(),
      }),
    )
    .output(zBookmarkListSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await ctx.db
          .insert(bookmarkLists)
          .values({
            name: input.name,
            icon: input.icon,
            userId: ctx.user.id,
          })
          .returning();
        return result[0];
      } catch (e) {
        if (e instanceof SqliteError) {
          if (e.code == "SQLITE_CONSTRAINT_UNIQUE") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "List already exists",
            });
          }
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong",
        });
      }
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
              message: "Bookmark already in the list",
            });
          }
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong",
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
});
