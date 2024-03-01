"use client";

import BookmarksGrid from "@/app/dashboard/bookmarks/components/BookmarksGrid";
import { ZBookmark } from "@/lib/types/api/bookmarks";
import { ZBookmarkListWithBookmarks } from "@/lib/types/api/lists";
import { api } from "@/lib/trpc";
import DeleteListButton from "./DeleteListButton";

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
    <div className="container flex flex-col gap-3">
      <div className="flex justify-between">
        <span className="pt-4 text-2xl">
          {data.icon} {data.name}
        </span>
        <DeleteListButton list={data} />
      </div>
      <hr />
      <BookmarksGrid query={{ ids: data.bookmarks }} bookmarks={bookmarks} />
    </div>
  );
}
