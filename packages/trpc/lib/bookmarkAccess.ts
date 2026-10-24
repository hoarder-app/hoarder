import { and, eq, exists, isNotNull, or } from "drizzle-orm";
import type { SQL } from "drizzle-orm";

import {
  bookmarkLists,
  bookmarks,
  bookmarksInLists,
  listCollaborators,
} from "@karakeep/db/schema";

import type { AuthedContext } from "..";

type DB = AuthedContext["db"];

/**
 * Bookmarks the user may view: bookmarks they own, or bookmarks contained in a
 * manual list they own or collaborate on.
 *
 * Keep this predicate at the database boundary as well as in search filters.
 * Search indexes are external projections and their returned IDs must not be
 * treated as authorization decisions.
 */
export function visibleBookmarksCondition(db: DB, userId: string): SQL {
  return or(
    eq(bookmarks.userId, userId),
    exists(
      db
        .select({ bookmarkId: bookmarksInLists.bookmarkId })
        .from(bookmarksInLists)
        .innerJoin(bookmarkLists, eq(bookmarkLists.id, bookmarksInLists.listId))
        .leftJoin(
          listCollaborators,
          and(
            eq(listCollaborators.listId, bookmarkLists.id),
            eq(listCollaborators.userId, userId),
          ),
        )
        .where(
          and(
            eq(bookmarksInLists.bookmarkId, bookmarks.id),
            or(
              eq(bookmarkLists.userId, userId),
              isNotNull(listCollaborators.id),
            ),
          ),
        ),
    ),
  )!;
}
