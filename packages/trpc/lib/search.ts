import {
  and,
  eq,
  exists,
  gt,
  gte,
  like,
  lt,
  lte,
  notExists,
  notLike,
} from "drizzle-orm";

import {
  bookmarkLinks,
  bookmarkLists,
  bookmarks,
  bookmarksInLists,
  bookmarkTags,
  tagsOnBookmarks,
} from "@hoarder/db/schema";
import { Matcher } from "@hoarder/shared/types/search";

import { AuthedContext } from "..";

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
  db: AuthedContext["db"],
  userId: string,
  matcher: Matcher,
): Promise<BookmarkQueryReturnType[]> {
  switch (matcher.type) {
    case "tagName": {
      const comp = matcher.inverse ? notExists : exists;
      return db
        .selectDistinct({ id: bookmarks.id })
        .from(bookmarks)
        .where(
          and(
            eq(bookmarks.userId, userId),
            comp(
              db
                .select()
                .from(tagsOnBookmarks)
                .innerJoin(
                  bookmarkTags,
                  eq(tagsOnBookmarks.tagId, bookmarkTags.id),
                )
                .where(
                  and(
                    eq(tagsOnBookmarks.bookmarkId, bookmarks.id),
                    eq(bookmarkTags.userId, userId),
                    eq(bookmarkTags.name, matcher.tagName),
                  ),
                ),
            ),
          ),
        );
    }
    case "tagged": {
      const comp = matcher.tagged ? exists : notExists;
      return db
        .select({ id: bookmarks.id })
        .from(bookmarks)
        .where(
          and(
            eq(bookmarks.userId, userId),
            comp(
              db
                .select()
                .from(tagsOnBookmarks)
                .where(and(eq(tagsOnBookmarks.bookmarkId, bookmarks.id))),
            ),
          ),
        );
    }
    case "listName": {
      const comp = matcher.inverse ? notExists : exists;
      return db
        .selectDistinct({ id: bookmarks.id })
        .from(bookmarks)
        .where(
          and(
            eq(bookmarks.userId, userId),
            comp(
              db
                .select()
                .from(bookmarksInLists)
                .innerJoin(
                  bookmarkLists,
                  eq(bookmarksInLists.listId, bookmarkLists.id),
                )
                .where(
                  and(
                    eq(bookmarksInLists.bookmarkId, bookmarks.id),
                    eq(bookmarkLists.userId, userId),
                    eq(bookmarkLists.name, matcher.listName),
                  ),
                ),
            ),
          ),
        );
    }
    case "inlist": {
      const comp = matcher.inList ? exists : notExists;
      return db
        .select({ id: bookmarks.id })
        .from(bookmarks)
        .where(
          and(
            eq(bookmarks.userId, userId),
            comp(
              db
                .select()
                .from(bookmarksInLists)
                .where(and(eq(bookmarksInLists.bookmarkId, bookmarks.id))),
            ),
          ),
        );
    }
    case "archived": {
      return db
        .select({ id: bookmarks.id })
        .from(bookmarks)
        .where(
          and(
            eq(bookmarks.userId, userId),
            eq(bookmarks.archived, matcher.archived),
          ),
        );
    }
    case "url": {
      const comp = matcher.inverse ? notLike : like;
      return db
        .select({ id: bookmarkLinks.id })
        .from(bookmarkLinks)
        .leftJoin(bookmarks, eq(bookmarks.id, bookmarkLinks.id))
        .where(
          and(
            eq(bookmarks.userId, userId),
            comp(bookmarkLinks.url, `%${matcher.url}%`),
          ),
        );
    }
    case "favourited": {
      return db
        .select({ id: bookmarks.id })
        .from(bookmarks)
        .where(
          and(
            eq(bookmarks.userId, userId),
            eq(bookmarks.favourited, matcher.favourited),
          ),
        );
    }
    case "dateAfter": {
      const comp = matcher.inverse ? lt : gte;
      return db
        .select({ id: bookmarks.id })
        .from(bookmarks)
        .where(
          and(
            eq(bookmarks.userId, userId),
            comp(bookmarks.createdAt, matcher.dateAfter),
          ),
        );
    }
    case "dateBefore": {
      const comp = matcher.inverse ? gt : lte;
      return db
        .select({ id: bookmarks.id })
        .from(bookmarks)
        .where(
          and(
            eq(bookmarks.userId, userId),
            comp(bookmarks.createdAt, matcher.dateBefore),
          ),
        );
    }
    case "and": {
      const vals = await Promise.all(
        matcher.matchers.map((m) => getIds(db, userId, m)),
      );
      return intersect(vals);
    }
    case "or": {
      const vals = await Promise.all(
        matcher.matchers.map((m) => getIds(db, userId, m)),
      );
      return union(vals);
    }
    default: {
      throw new Error("Unknown matcher type");
    }
  }
}

export async function getBookmarkIdsFromMatcher(
  ctx: AuthedContext,
  matcher: Matcher,
): Promise<string[]> {
  const results = await getIds(ctx.db, ctx.user.id, matcher);
  return results.map((r) => r.id);
}
