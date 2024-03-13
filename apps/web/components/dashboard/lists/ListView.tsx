"use client";

import BookmarksGrid from "@/components/dashboard/bookmarks/BookmarksGrid";
import { api } from "@/lib/trpc";

import type { ZBookmark } from "@hoarder/trpc/types/bookmarks";
import type { ZBookmarkListWithBookmarks } from "@hoarder/trpc/types/lists";

export default function ListView({
  bookmarks,
  list: initialData,
}: {
  list: ZBookmarkListWithBookmarks;
  bookmarks: ZBookmark[];
}) {
  const { data } = api.lists.get.useQuery(
    { listId: initialData.id },
    {
      initialData,
    },
  );

  return (
    <BookmarksGrid query={{ ids: data.bookmarks }} bookmarks={bookmarks} />
  );
}
