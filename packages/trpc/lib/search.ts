import {
  and,
  eq,
  exists,
  gt,
  gte,
  inArray,
  isNotNull,
  isNull,
  like,
  lt,
  lte,
  ne,
  notExists,
  notInArray,
  notLike,
  or,
  SQL,
} from "drizzle-orm";

import {
  bookmarkAssets,
  bookmarkLinks,
  bookmarkLists,
  bookmarks,
  bookmarksInLists,
  bookmarkTags,
  highlights,
  listCollaborators,
  rssFeedImportsTable,
  rssFeedsTable,
  tagsOnBookmarks,
} from "@karakeep/db/schema";
import { Matcher } from "@karakeep/shared/types/search";
import { toAbsoluteDate } from "@karakeep/shared/utils/relativeDateUtils";

import { AuthedContext } from "..";
import { visibleBookmarksCondition } from "./bookmarkAccess";

interface BookmarkQueryReturnType {
  id: string;
}

type DB = AuthedContext["db"];

/**
 * Lists the user can resolve by name: the ones they own, plus the ones shared
 * with them through an accepted invitation.
 */
function visibleLists(db: DB, userId: string): SQL {
  return or(
    eq(bookmarkLists.userId, userId),
    exists(
      db
        .select({ id: listCollaborators.id })
        .from(listCollaborators)
        .where(
          and(
            eq(listCollaborators.listId, bookmarkLists.id),
            eq(listCollaborators.userId, userId),
          ),
        ),
    ),
  )!;
}

/**
 * Bookmarks the user may view but doesn't own. Search uses these to widen the
 * index filter, which is otherwise scoped to the bookmark's owner.
 */
export async function getSharedBookmarkIds(ctx: AuthedContext) {
  const { db } = ctx;
  const userId = ctx.user.id;

  // Start from list membership rather than scanning every bookmark on the
  // server. Besides using the list-first index, this also covers bookmarks
  // copied into a list the caller owns after the source shared list (and its
  // collaborator rows) has been deleted.
  const rows = await db
    .selectDistinct({ id: bookmarksInLists.bookmarkId })
    .from(bookmarksInLists)
    .innerJoin(bookmarkLists, eq(bookmarkLists.id, bookmarksInLists.listId))
    .innerJoin(bookmarks, eq(bookmarks.id, bookmarksInLists.bookmarkId))
    .leftJoin(
      listCollaborators,
      and(
        eq(listCollaborators.listId, bookmarkLists.id),
        eq(listCollaborators.userId, userId),
      ),
    )
    .where(
      and(
        ne(bookmarks.userId, userId),
        or(eq(bookmarkLists.userId, userId), isNotNull(listCollaborators.id)),
      ),
    );
  return rows.map((r) => r.id);
}

/**
 * Which bookmarks a matcher is allowed to range over.
 *
 * - `owned`: only the caller's bookmarks. This is what smart lists evaluate
 *   against, and what matchers over owner-private state use.
 * - `visible`: also bookmarks reachable through a list shared with the caller.
 */
export type BookmarkScope = "owned" | "visible";

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
  scope: BookmarkScope,
  visitedListIds = new Set<string>(),
): Promise<BookmarkQueryReturnType[]> {
  const { db } = ctx;
  const userId = ctx.user.id;

  // The bookmark set that content-level matchers range over.
  //
  // Matchers over owner-private state (`tagName`, `tagged`, `hasNotes`,
  // `hasHighlights`, `archived`, `favourited`, `rssFeedName`) deliberately keep
  // using `eq(bookmarks.userId, userId)` even under the `visible` scope:
  // collaborators can't set tags, notes or highlights on a bookmark they don't
  // own, and `asZBookmark()` hides the archived/favourited/note fields from
  // them, so matching on those would return rows whose displayed state
  // contradicts the query.
  const scoped =
    scope === "visible"
      ? visibleBookmarksCondition(db, userId)
      : eq(bookmarks.userId, userId);

  switch (matcher.type) {
    case "tagName": {
      if (!matcher.inverse) {
        return db
          .selectDistinct({ id: bookmarks.id })
          .from(bookmarkTags)
          .crossJoin(tagsOnBookmarks)
          .crossJoin(bookmarks)
          .where(
            and(
              eq(bookmarkTags.userId, userId),
              eq(bookmarkTags.name, matcher.tagName),
              eq(tagsOnBookmarks.tagId, bookmarkTags.id),
              eq(bookmarks.id, tagsOnBookmarks.bookmarkId),
              eq(bookmarks.userId, userId),
            ),
          );
      }

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
      // First, look up the list by name. When searching over visible
      // bookmarks, lists shared with the user resolve here too, not just the
      // ones they own.
      const lists = await db.query.bookmarkLists.findMany({
        where: and(
          scope === "visible"
            ? visibleLists(db, userId)
            : eq(bookmarkLists.userId, userId),
          eq(bookmarkLists.name, matcher.listName),
        ),
      });

      if (lists.length === 0) {
        // No matching lists
        return [];
      }

      // Use List model to resolve list membership (manual and smart)
      // Import dynamically to avoid circular dependency
      const { List } = await import("../models/lists");
      const listBookmarkIds = [
        ...new Set(
          (
            await Promise.all(
              lists.map(async (list) => {
                const listModel = await List.fromId(ctx, list.id);
                return await listModel.getBookmarkIds(visitedListIds);
              }),
            )
          ).flat(),
        ),
      ];

      if (listBookmarkIds.length === 0) {
        if (matcher.inverse) {
          return db
            .selectDistinct({ id: bookmarks.id })
            .from(bookmarks)
            .where(scoped);
        }
        return [];
      }

      return db
        .selectDistinct({ id: bookmarks.id })
        .from(bookmarks)
        .where(
          and(
            scoped,
            matcher.inverse
              ? notInArray(bookmarks.id, listBookmarkIds)
              : inArray(bookmarks.id, listBookmarkIds),
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
            scoped,
            comp(
              db
                .select()
                .from(bookmarksInLists)
                .where(and(eq(bookmarksInLists.bookmarkId, bookmarks.id))),
            ),
          ),
        );
    }
    case "rssFeedName": {
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
                .from(rssFeedImportsTable)
                .innerJoin(
                  rssFeedsTable,
                  eq(rssFeedImportsTable.rssFeedId, rssFeedsTable.id),
                )
                .where(
                  and(
                    eq(rssFeedImportsTable.bookmarkId, bookmarks.id),
                    eq(rssFeedsTable.userId, userId),
                    eq(rssFeedsTable.name, matcher.feedName),
                  ),
                ),
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
        .where(and(scoped, comp(bookmarkLinks.url, `%${matcher.url}%`)))
        .union(
          db
            .select({ id: bookmarkAssets.id })
            .from(bookmarkAssets)
            .leftJoin(bookmarks, eq(bookmarks.id, bookmarkAssets.id))
            .where(
              and(
                scoped,
                // When a user is asking for a link, the inverse matcher should match only assets with URLs.
                isNotNull(bookmarkAssets.sourceUrl),
                comp(bookmarkAssets.sourceUrl, `%${matcher.url}%`),
              ),
            ),
        );
    }
    case "title": {
      const comp = matcher.inverse ? notLike : like;
      if (matcher.inverse) {
        return db
          .select({ id: bookmarks.id })
          .from(bookmarks)
          .leftJoin(bookmarkLinks, eq(bookmarks.id, bookmarkLinks.id))
          .where(
            and(
              scoped,
              or(
                isNull(bookmarks.title),
                comp(bookmarks.title, `%${matcher.title}%`),
              ),
              or(
                isNull(bookmarkLinks.title),
                comp(bookmarkLinks.title, `%${matcher.title}%`),
              ),
            ),
          );
      }

      return db
        .select({ id: bookmarks.id })
        .from(bookmarks)
        .where(and(scoped, comp(bookmarks.title, `%${matcher.title}%`)))
        .union(
          db
            .select({ id: bookmarkLinks.id })
            .from(bookmarkLinks)
            .leftJoin(bookmarks, eq(bookmarks.id, bookmarkLinks.id))
            .where(
              and(scoped, comp(bookmarkLinks.title, `%${matcher.title}%`)),
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
    case "hasNotes": {
      return db
        .select({ id: bookmarks.id })
        .from(bookmarks)
        .where(
          and(
            eq(bookmarks.userId, userId),
            matcher.hasNotes
              ? and(isNotNull(bookmarks.note), ne(bookmarks.note, ""))
              : or(isNull(bookmarks.note), eq(bookmarks.note, "")),
          ),
        );
    }
    case "hasHighlights": {
      const comp = matcher.hasHighlights ? exists : notExists;
      return db
        .select({ id: bookmarks.id })
        .from(bookmarks)
        .where(
          and(
            eq(bookmarks.userId, userId),
            comp(
              db
                .select()
                .from(highlights)
                .where(
                  and(
                    eq(highlights.bookmarkId, bookmarks.id),
                    eq(highlights.userId, userId),
                  ),
                ),
            ),
          ),
        );
    }
    case "dateAfter": {
      const comp = matcher.inverse ? lt : gte;
      return db
        .select({ id: bookmarks.id })
        .from(bookmarks)
        .where(and(scoped, comp(bookmarks.createdAt, matcher.dateAfter)));
    }
    case "dateBefore": {
      const comp = matcher.inverse ? gt : lte;
      return db
        .select({ id: bookmarks.id })
        .from(bookmarks)
        .where(and(scoped, comp(bookmarks.createdAt, matcher.dateBefore)));
    }
    case "age": {
      const comp = matcher.relativeDate.direction === "newer" ? gte : lt;
      return db
        .select({ id: bookmarks.id })
        .from(bookmarks)
        .where(
          and(
            scoped,
            comp(bookmarks.createdAt, toAbsoluteDate(matcher.relativeDate)),
          ),
        );
    }
    case "type": {
      const comp = matcher.inverse ? ne : eq;
      return db
        .select({ id: bookmarks.id })
        .from(bookmarks)
        .where(and(scoped, comp(bookmarks.type, matcher.typeName)));
    }
    case "brokenLinks": {
      // Only applies to bookmarks of type LINK
      return db
        .select({ id: bookmarkLinks.id })
        .from(bookmarkLinks)
        .leftJoin(bookmarks, eq(bookmarks.id, bookmarkLinks.id))
        .where(
          and(
            scoped,
            matcher.brokenLinks
              ? or(
                  eq(bookmarkLinks.crawlStatus, "failure"),
                  lt(bookmarkLinks.crawlStatusCode, 200),
                  gt(bookmarkLinks.crawlStatusCode, 299),
                )
              : and(
                  eq(bookmarkLinks.crawlStatus, "success"),
                  gte(bookmarkLinks.crawlStatusCode, 200),
                  lte(bookmarkLinks.crawlStatusCode, 299),
                ),
          ),
        );
    }
    case "source": {
      return db
        .select({ id: bookmarks.id })
        .from(bookmarks)
        .where(
          and(
            scoped,
            matcher.inverse
              ? or(
                  ne(bookmarks.source, matcher.source),
                  isNull(bookmarks.source),
                )
              : eq(bookmarks.source, matcher.source),
          ),
        );
    }
    case "and": {
      const vals = await Promise.all(
        matcher.matchers.map((m) => getIds(ctx, m, scope, visitedListIds)),
      );
      return intersect(vals);
    }
    case "or": {
      const vals = await Promise.all(
        matcher.matchers.map((m) => getIds(ctx, m, scope, visitedListIds)),
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
  scope: BookmarkScope = "owned",
  visitedListIds = new Set<string>(),
): Promise<string[]> {
  const results = await getIds(ctx, matcher, scope, visitedListIds);
  return results.map((r) => r.id);
}
