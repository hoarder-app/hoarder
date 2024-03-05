"use client";

import BookmarksGrid from "@/app/dashboard/bookmarks/components/BookmarksGrid";
import { ZBookmark } from "@hoarder/trpc/types/bookmarks";
import { ZBookmarkListWithBookmarks } from "@hoarder/trpc/types/lists";
import { api } from "@/lib/trpc";

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
