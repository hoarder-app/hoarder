"use client";

import LinkCard from "./LinkCard";
import { ZBookmark, ZGetBookmarksRequest } from "@/lib/types/api/bookmarks";
import { api } from "@/lib/trpc";
import TextCard from "./TextCard";
import { Slot } from "@radix-ui/react-slot";

function renderBookmark(bookmark: ZBookmark) {
  let comp;
  switch (bookmark.content.type) {
    case "link":
      comp = <LinkCard key={bookmark.id} bookmark={bookmark} />;
      break;
    case "text":
      comp = <TextCard key={bookmark.id} bookmark={bookmark} />;
      break;
  }
  return (
    <Slot key={bookmark.id} className="border-grey-100 mb-4 border bg-gray-50 duration-300 ease-in hover:border-blue-300 hover:transition-all">
      {comp}
    </Slot>
  );
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
      {data.bookmarks.map((b) => renderBookmark(b))}
    </div>
  );
}
