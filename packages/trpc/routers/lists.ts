import { experimental_trpcMiddleware } from "@trpc/server";
import { z } from "zod";

import {
  zBookmarkListSchema,
  zEditBookmarkListSchemaWithValidation,
  zMergeListSchema,
  zNewBookmarkListSchema,
} from "@karakeep/shared/types/lists";

import type { AuthedContext } from "../index";
import { authedProcedure, router } from "../index";
import { List } from "../models/lists";
import { ensureBookmarkOwnership } from "./bookmarks";

export const ensureListOwnership = experimental_trpcMiddleware<{
  ctx: AuthedContext;
  input: { listId: string };
}>().create(async (opts) => {
  const list = await List.fromId(opts.ctx, opts.input.listId);
  return opts.next({
    ctx: {
      ...opts.ctx,
      list,
    },
  });
});

export const ensureListAccess = experimental_trpcMiddleware<{
  ctx: AuthedContext & { list: List };
  input: { password?: string };
}>().create(async (opts) => {
  await opts.ctx.list.ensureCanAccessLocked(opts.input.password);
  return opts.next({
    ctx: opts.ctx,
  });
});

export const listsAppRouter = router({
  create: authedProcedure
    .input(zNewBookmarkListSchema)
    .output(zBookmarkListSchema)
    .mutation(async ({ input, ctx }) => {
      return await List.create(ctx, input).then((l) => l.publicList);
    }),
  edit: authedProcedure
    .input(zEditBookmarkListSchemaWithValidation)
    .output(zBookmarkListSchema)
    .use(ensureListOwnership)
    .mutation(async ({ input, ctx }) => {
      await ctx.list.update(input);
      return ctx.list.publicList;
    }),
  merge: authedProcedure
    .input(zMergeListSchema)
    .mutation(async ({ input, ctx }) => {
      const [sourceList, targetList] = await Promise.all([
        List.fromId(ctx, input.sourceId),
        List.fromId(ctx, input.targetId),
      ]);
      return await sourceList.mergeInto(
        targetList,
        input.deleteSourceAfterMerge,
      );
    }),
  delete: authedProcedure
    .input(
      z.object({
        listId: z.string(),
      }),
    )
    .use(ensureListOwnership)
    .mutation(async ({ ctx }) => {
      await ctx.list.delete();
    }),
  addToList: authedProcedure
    .input(
      z.object({
        listId: z.string(),
        bookmarkId: z.string(),
        password: z.string().optional(),
      }),
    )
    .use(ensureListOwnership)
    .use(ensureListAccess)
    .use(ensureBookmarkOwnership)
    .mutation(async ({ input, ctx }) => {
      await ctx.list.addBookmark(input.bookmarkId);
    }),
  removeFromList: authedProcedure
    .input(
      z.object({
        listId: z.string(),
        bookmarkId: z.string(),
        password: z.string().optional(),
      }),
    )
    .use(ensureListOwnership)
    .use(ensureListAccess)
    .use(ensureBookmarkOwnership)
    .mutation(async ({ input, ctx }) => {
      await ctx.list.removeBookmark(input.bookmarkId);
    }),
  get: authedProcedure
    .input(
      z.object({
        listId: z.string(),
      }),
    )
    .output(zBookmarkListSchema)
    .use(ensureListOwnership)
    .query(({ ctx }) => {
      return ctx.list.publicList;
    }),
  list: authedProcedure
    .output(
      z.object({
        lists: z.array(zBookmarkListSchema),
      }),
    )
    .query(async ({ ctx }) => {
      // Include locked lists for the owner - they should see their own locked lists in UI
      const results = await List.getAll(ctx, true);
      return { lists: results.map((l) => l.publicList) };
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
      const lists = await List.forBookmark(ctx, input.bookmarkId);
      return { lists: lists.map((l) => l.publicList) };
    }),
  stats: authedProcedure
    .output(
      z.object({
        stats: z.map(z.string(), z.number()),
      }),
    )
    .query(async ({ ctx }) => {
      const lists = await List.getAll(ctx);
      const sizes = await Promise.all(lists.map((l) => l.getSize()));
      return {
        stats: new Map(lists.map((l, i) => [l.publicList.id, sizes[i]])),
      };
    }),

  // Rss endpoints
  regenRssToken: authedProcedure
    .input(
      z.object({
        listId: z.string(),
      }),
    )
    .output(
      z.object({
        token: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const list = await List.fromId(ctx, input.listId);
      const token = await list.regenRssToken();
      return { token: token! };
    }),
  clearRssToken: authedProcedure
    .input(
      z.object({
        listId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const list = await List.fromId(ctx, input.listId);
      await list.clearRssToken();
    }),
  getRssToken: authedProcedure
    .input(
      z.object({
        listId: z.string(),
      }),
    )
    .output(
      z.object({
        token: z.string().nullable(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const list = await List.fromId(ctx, input.listId);
      return { token: await list.getRssToken() };
    }),

  // Locked list endpoints
  verifyListPassword: authedProcedure
    .input(
      z.object({
        listId: z.string(),
        password: z.string(),
      }),
    )
    .output(
      z.object({
        valid: z.boolean(),
      }),
    )
    .use(ensureListOwnership)
    .mutation(async ({ input, ctx }) => {
      const valid = await ctx.list.verifyPassword(input.password);
      return { valid };
    }),

  getWithPassword: authedProcedure
    .input(
      z.object({
        listId: z.string(),
        password: z.string().optional(),
      }),
    )
    .output(zBookmarkListSchema)
    .use(ensureListOwnership)
    .query(async ({ input, ctx }) => {
      await ctx.list.ensureCanAccessLocked(input.password);
      return ctx.list.publicList;
    }),

  getLockedLists: authedProcedure
    .output(
      z.object({
        lists: z.array(zBookmarkListSchema),
      }),
    )
    .query(async ({ ctx }) => {
      const allLists = await List.getAll(ctx, true);
      const lockedLists = allLists.filter((l) => l.publicList.locked);
      return { lists: lockedLists.map((l) => l.publicList) };
    }),
});
