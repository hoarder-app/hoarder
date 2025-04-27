import {
  and,
  eq,
  exists,
  gt,
  gte,
  inArray,
  isNotNull,
  like,
  lt,
  lte,
  ne,
  notExists,
  notInArray,
  notLike,
} from "drizzle-orm";

import {
  bookmarkAssets,
  bookmarkLinks,
  bookmarks,
  bookmarkTags,
  rssFeedImportsTable,
  rssFeedsTable,
  tagsOnBookmarks,
} from "@karakeep/db/schema";
import { Matcher } from "@karakeep/shared/types/search";
import { toAbsoluteDate } from "@karakeep/shared/utils/relativeDateUtils";

import { AuthedContext } from "..";
import { List } from "../models/lists";

interface BookmarkQueryReturnType {
  id: string;
}

function intersect(
  vals: BookmarkQueryReturnType[][],
): BookmarkQueryReturnType[] {
  if (!vals || vals.length === 0) {
    return [];
  }

  if (vals.length === 1) {
    return [...vals[0]];
  }

  const countMap = new Map<string, number>();
  const map = new Map<string, BookmarkQueryReturnType>();

  for (const arr of vals) {
    for (const item of arr) {
      countMap.set(item.id, (countMap.get(item.id) ?? 0) + 1);
      map.set(item.id, item);
    }
  }

  const result: BookmarkQueryReturnType[] = [];
  for (const [id, count] of countMap) {
    if (count === vals.length) {
      result.push(map.get(id)!);
    }
  }

  return result;
}

function union(vals: BookmarkQueryReturnType[][]): BookmarkQueryReturnType[] {
  if (!vals || vals.length === 0) {
    return [];
  }

  const uniqueIds = new Set<string>();
  const map = new Map<string, BookmarkQueryReturnType>();
  for (const arr of vals) {
    for (const item of arr) {
      uniqueIds.add(item.id);
      map.set(item.id, item);
    }
  }

  const result: BookmarkQueryReturnType[] = [];
  for (const id of uniqueIds) {
    result.push(map.get(id)!);
  }

  return result;
}

async function getIds(
  ctx: AuthedContext,
  matcher: Matcher,
): Promise<BookmarkQueryReturnType[]> {
  switch (matcher.type) {
    case "tagName": {
      const comp = matcher.inverse ? notExists : exists;
      return ctx.db
        .selectDistinct({ id: bookmarks.id })
        .from(bookmarks)
        .where(
          and(
            eq(bookmarks.userId, ctx.user.id),
            comp(
              ctx.db
                .select()
                .from(tagsOnBookmarks)
                .innerJoin(
                  bookmarkTags,
                  eq(tagsOnBookmarks.tagId, bookmarkTags.id),
                )
                .where(
                  and(
                    eq(tagsOnBookmarks.bookmarkId, bookmarks.id),
                    eq(bookmarkTags.userId, ctx.user.id),
                    eq(bookmarkTags.name, matcher.tagName),
                  ),
                ),
            ),
          ),
        );
    }
    case "tagged": {
      const comp = matcher.tagged ? exists : notExists;
      return ctx.db
        .select({ id: bookmarks.id })
        .from(bookmarks)
        .where(
          and(
            eq(bookmarks.userId, ctx.user.id),
            comp(
              ctx.db
                .select()
                .from(tagsOnBookmarks)
                .where(and(eq(tagsOnBookmarks.bookmarkId, bookmarks.id))),
            ),
          ),
        );
    }
    case "listName": {
      const lists = await List.fromName(ctx, matcher.listName);
      const ids = await Promise.all(lists.map((l) => l.getBookmarkIds()));
      const comp = matcher.inverse ? notInArray : inArray;
      return ctx.db
        .select({ id: bookmarks.id })
        .from(bookmarks)
        .where(
          and(
            eq(bookmarks.userId, ctx.user.id),
            comp(bookmarks.id, ids.flat()),
          ),
        );
    }
    case "inlist": {
      const lists = await List.getAll(ctx);
      const ids = await Promise.all(lists.map((l) => l.getBookmarkIds()));
      const comp = matcher.inList ? inArray : notInArray;
      return ctx.db
        .select({ id: bookmarks.id })
        .from(bookmarks)
        .where(
          and(
            eq(bookmarks.userId, ctx.user.id),
            comp(bookmarks.id, ids.flat()),
          ),
        );
    }
    case "rssFeedName": {
      const comp = matcher.inverse ? notExists : exists;
      return ctx.db
        .selectDistinct({ id: bookmarks.id })
        .from(bookmarks)
        .where(
          and(
            eq(bookmarks.userId, ctx.user.id),
            comp(
              ctx.db
                .select()
                .from(rssFeedImportsTable)
                .innerJoin(
                  rssFeedsTable,
                  eq(rssFeedImportsTable.rssFeedId, rssFeedsTable.id),
                )
                .where(
                  and(
                    eq(rssFeedImportsTable.bookmarkId, bookmarks.id),
                    eq(rssFeedsTable.userId, ctx.user.id),
                    eq(rssFeedsTable.name, matcher.feedName),
                  ),
                ),
            ),
          ),
        );
    }
    case "archived": {
      return ctx.db
        .select({ id: bookmarks.id })
        .from(bookmarks)
        .where(
          and(
            eq(bookmarks.userId, ctx.user.id),
            eq(bookmarks.archived, matcher.archived),
          ),
        );
    }
    case "url": {
      const comp = matcher.inverse ? notLike : like;
      return ctx.db
        .select({ id: bookmarkLinks.id })
        .from(bookmarkLinks)
        .leftJoin(bookmarks, eq(bookmarks.id, bookmarkLinks.id))
        .where(
          and(
            eq(bookmarks.userId, ctx.user.id),
            comp(bookmarkLinks.url, `%${matcher.url}%`),
          ),
        )
        .union(
          ctx.db
            .select({ id: bookmarkAssets.id })
            .from(bookmarkAssets)
            .leftJoin(bookmarks, eq(bookmarks.id, bookmarkAssets.id))
            .where(
              and(
                eq(bookmarks.userId, ctx.user.id),
                // When a user is asking for a link, the inverse matcher should match only assets with URLs.
                isNotNull(bookmarkAssets.sourceUrl),
                comp(bookmarkAssets.sourceUrl, `%${matcher.url}%`),
              ),
            ),
        );
    }
    case "favourited": {
      return ctx.db
        .select({ id: bookmarks.id })
        .from(bookmarks)
        .where(
          and(
            eq(bookmarks.userId, ctx.user.id),
            eq(bookmarks.favourited, matcher.favourited),
          ),
        );
    }
    case "dateAfter": {
      const comp = matcher.inverse ? lt : gte;
      return ctx.db
        .select({ id: bookmarks.id })
        .from(bookmarks)
        .where(
          and(
            eq(bookmarks.userId, ctx.user.id),
            comp(bookmarks.createdAt, matcher.dateAfter),
          ),
        );
    }
    case "dateBefore": {
      const comp = matcher.inverse ? gt : lte;
      return ctx.db
        .select({ id: bookmarks.id })
        .from(bookmarks)
        .where(
          and(
            eq(bookmarks.userId, ctx.user.id),
            comp(bookmarks.createdAt, matcher.dateBefore),
          ),
        );
    }
    case "age": {
      const comp = matcher.relativeDate.direction === "newer" ? gte : lt;
      return ctx.db
        .select({ id: bookmarks.id })
        .from(bookmarks)
        .where(
          and(
            eq(bookmarks.userId, ctx.user.id),
            comp(bookmarks.createdAt, toAbsoluteDate(matcher.relativeDate)),
          ),
        );
    }
    case "type": {
      const comp = matcher.inverse ? ne : eq;
      return ctx.db
        .select({ id: bookmarks.id })
        .from(bookmarks)
        .where(
          and(
            eq(bookmarks.userId, ctx.user.id),
            comp(bookmarks.type, matcher.typeName),
          ),
        );
    }
    case "and": {
      const vals = await Promise.all(
        matcher.matchers.map((m) => getIds(ctx, m)),
      );
      return intersect(vals);
    }
    case "or": {
      const vals = await Promise.all(
        matcher.matchers.map((m) => getIds(ctx, m)),
      );
      return union(vals);
    }
    default: {
      const _exhaustiveCheck: never = matcher;
      throw new Error("Unknown matcher type");
    }
  }
}

export async function getBookmarkIdsFromMatcher(
  ctx: AuthedContext,
  matcher: Matcher,
): Promise<string[]> {
  const results = await getIds(ctx, matcher);
  return results.map((r) => r.id);
}
