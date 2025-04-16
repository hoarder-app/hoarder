import { TRPCError } from "@trpc/server";
import { and, count, eq } from "drizzle-orm";
import invariant from "tiny-invariant";
import { z } from "zod";

import { SqliteError } from "@karakeep/db";
import { bookmarkLists, bookmarksInLists } from "@karakeep/db/schema";
import { parseSearchQuery } from "@karakeep/shared/searchQueryParser";
import {
  ZBookmarkList,
  zEditBookmarkListSchemaWithValidation,
  zNewBookmarkListSchema,
} from "@karakeep/shared/types/lists";

import { AuthedContext } from "..";
import { getBookmarkIdsFromMatcher } from "../lib/search";
import { PrivacyAware } from "./privacy";

export abstract class List implements PrivacyAware {
  protected constructor(
    protected ctx: AuthedContext,
    public list: ZBookmarkList & { userId: string },
  ) {}

  private static fromData(
    ctx: AuthedContext,
    data: ZBookmarkList & { userId: string },
  ) {
    if (data.type === "smart") {
      return new SmartList(ctx, data);
    } else {
      return new ManualList(ctx, data);
    }
  }

  static async fromId(
    ctx: AuthedContext,
    id: string,
  ): Promise<ManualList | SmartList> {
    const list = await ctx.db.query.bookmarkLists.findFirst({
      where: and(
        eq(bookmarkLists.id, id),
        eq(bookmarkLists.userId, ctx.user.id),
      ),
    });

    if (!list) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "List not found",
      });
    }
    if (list.type === "smart") {
      return new SmartList(ctx, list);
    } else {
      return new ManualList(ctx, list);
    }
  }

  static async create(
    ctx: AuthedContext,
    input: z.infer<typeof zNewBookmarkListSchema>,
  ): Promise<ManualList | SmartList> {
    const [result] = await ctx.db
      .insert(bookmarkLists)
      .values({
        name: input.name,
        description: input.description,
        icon: input.icon,
        userId: ctx.user.id,
        parentId: input.parentId,
        type: input.type,
        query: input.query,
      })
      .returning();
    return this.fromData(ctx, result);
  }

  static async getAll(ctx: AuthedContext): Promise<(ManualList | SmartList)[]> {
    const lists = await ctx.db.query.bookmarkLists.findMany({
      where: and(eq(bookmarkLists.userId, ctx.user.id)),
    });
    return lists.map((l) => this.fromData(ctx, l));
  }

  static async forBookmark(ctx: AuthedContext, bookmarkId: string) {
    const lists = await ctx.db.query.bookmarksInLists.findMany({
      where: and(eq(bookmarksInLists.bookmarkId, bookmarkId)),
      with: {
        list: true,
      },
    });
    invariant(lists.map((l) => l.list.userId).every((id) => id == ctx.user.id));
    return lists.map((l) => this.fromData(ctx, l.list));
  }

  ensureCanAccess(ctx: AuthedContext): void {
    if (this.list.userId != ctx.user.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "User is not allowed to access resource",
      });
    }
  }

  async delete() {
    const res = await this.ctx.db
      .delete(bookmarkLists)
      .where(
        and(
          eq(bookmarkLists.id, this.list.id),
          eq(bookmarkLists.userId, this.ctx.user.id),
        ),
      );
    if (res.changes == 0) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }
  }

  async update(input: z.infer<typeof zEditBookmarkListSchemaWithValidation>) {
    const result = await this.ctx.db
      .update(bookmarkLists)
      .set({
        name: input.name,
        description: input.description,
        icon: input.icon,
        parentId: input.parentId,
        query: input.query,
      })
      .where(
        and(
          eq(bookmarkLists.id, this.list.id),
          eq(bookmarkLists.userId, this.ctx.user.id),
        ),
      )
      .returning();
    if (result.length == 0) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }
    return result[0];
  }

  abstract get type(): "manual" | "smart";
  abstract getBookmarkIds(ctx: AuthedContext): Promise<string[]>;
  abstract getSize(ctx: AuthedContext): Promise<number>;
  abstract addBookmark(bookmarkId: string): Promise<void>;
  abstract removeBookmark(bookmarkId: string): Promise<void>;
  abstract mergeInto(
    targetList: List,
    deleteSourceAfterMerge: boolean,
  ): Promise<void>;
}

export class SmartList extends List {
  parsedQuery: ReturnType<typeof parseSearchQuery> | null = null;

  constructor(ctx: AuthedContext, list: ZBookmarkList & { userId: string }) {
    super(ctx, list);
  }

  get type(): "smart" {
    invariant(this.list.type === "smart");
    return this.list.type;
  }

  get query() {
    invariant(this.list.query);
    return this.list.query;
  }

  getParsedQuery() {
    if (!this.parsedQuery) {
      const result = parseSearchQuery(this.query);
      if (result.result !== "full") {
        throw new Error("Invalid smart list query");
      }
      this.parsedQuery = result;
    }
    return this.parsedQuery;
  }

  async getBookmarkIds(): Promise<string[]> {
    const parsedQuery = this.getParsedQuery();
    if (!parsedQuery.matcher) {
      return [];
    }
    return await getBookmarkIdsFromMatcher(this.ctx, parsedQuery.matcher);
  }

  async getSize(): Promise<number> {
    return await this.getBookmarkIds().then((ids) => ids.length);
  }

  addBookmark(_bookmarkId: string): Promise<void> {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Smart lists cannot be added to",
    });
  }

  removeBookmark(_bookmarkId: string): Promise<void> {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Smart lists cannot be removed from",
    });
  }

  mergeInto(
    _targetList: List,
    _deleteSourceAfterMerge: boolean,
  ): Promise<void> {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Smart lists cannot be merged",
    });
  }
}

export class ManualList extends List {
  constructor(ctx: AuthedContext, list: ZBookmarkList & { userId: string }) {
    super(ctx, list);
  }

  get type(): "manual" {
    invariant(this.list.type === "manual");
    return this.list.type;
  }

  async getBookmarkIds(): Promise<string[]> {
    const results = await this.ctx.db
      .select({ id: bookmarksInLists.bookmarkId })
      .from(bookmarksInLists)
      .where(eq(bookmarksInLists.listId, this.list.id));
    return results.map((r) => r.id);
  }

  async getSize(): Promise<number> {
    const results = await this.ctx.db
      .select({ count: count() })
      .from(bookmarksInLists)
      .where(eq(bookmarksInLists.listId, this.list.id));
    return results[0].count;
  }

  async addBookmark(bookmarkId: string): Promise<void> {
    try {
      await this.ctx.db.insert(bookmarksInLists).values({
        listId: this.list.id,
        bookmarkId,
      });
    } catch (e) {
      if (e instanceof SqliteError) {
        if (e.code == "SQLITE_CONSTRAINT_PRIMARYKEY") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Bookmark ${bookmarkId} is already in the list ${this.list.id}`,
          });
        }
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Something went wrong",
      });
    }
  }

  async removeBookmark(bookmarkId: string): Promise<void> {
    const deleted = await this.ctx.db
      .delete(bookmarksInLists)
      .where(
        and(
          eq(bookmarksInLists.listId, this.list.id),
          eq(bookmarksInLists.bookmarkId, bookmarkId),
        ),
      );
    if (deleted.changes == 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Bookmark ${bookmarkId} is already not in list ${this.list.id}`,
      });
    }
  }

  async update(input: z.infer<typeof zEditBookmarkListSchemaWithValidation>) {
    if (input.query) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Manual lists cannot have a query",
      });
    }
    return super.update(input);
  }

  async mergeInto(
    targetList: List,
    deleteSourceAfterMerge: boolean,
  ): Promise<void> {
    if (targetList.type !== "manual") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "You can only merge into a manual list",
      });
    }

    const bookmarkIds = await this.getBookmarkIds();

    await this.ctx.db.transaction(async (tx) => {
      await tx
        .insert(bookmarksInLists)
        .values(
          bookmarkIds.map((id) => ({
            bookmarkId: id,
            listId: targetList.list.id,
          })),
        )
        .onConflictDoNothing();

      if (deleteSourceAfterMerge) {
        await tx
          .delete(bookmarkLists)
          .where(eq(bookmarkLists.id, this.list.id));
      }
    });
  }
}
