"use client";

import LinkCard from "./LinkCard";
import { ZBookmark, ZGetBookmarksRequest } from "@/lib/types/api/bookmarks";
import { api } from "@/lib/trpc";
import TextCard from "./TextCard";

function renderBookmark(bookmark: ZBookmark, className: string) {
  switch (bookmark.content.type) {
    case "link":
      return (
        <LinkCard key={bookmark.id} bookmark={bookmark} className={className} />
      );
    case "text":
      return (
        <TextCard key={bookmark.id} bookmark={bookmark} className={className} />
      );
  }
}

export default function BookmarksGrid({
  query,
  bookmarks: initialBookmarks,
}: {
  query: ZGetBookmarksRequest;
  bookmarks: ZBookmark[];
}) {
  const { data } = api.bookmarks.getBookmarks.useQuery(query, {
    initialData: { bookmarks: initialBookmarks },
  });
  if (data.bookmarks.length == 0) {
    return <p>No bookmarks</p>;
  }
  return (
    <div className="columns-1 gap-4 transition-all duration-300 md:columns-2 lg:columns-3">
      {data.bookmarks.map((b) =>
        renderBookmark(
          b,
          "border-grey-100 border bg-gray-50 duration-300 ease-in hover:border-blue-300 hover:transition-all mb-4",
        ),
      )}
    </div>
  );
}
