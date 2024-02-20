"use client";

import { useLoadingCard } from "@/lib/hooks/use-loading-card";
import BookmarkCardSkeleton from "./BookmarkCardSkeleton";
import LinkCard from "./LinkCard";
import { ZBookmark, ZGetBookmarksRequest } from "@/lib/types/api/bookmarks";
import { api } from "@/lib/trpc";

function renderBookmark(bookmark: ZBookmark) {
  switch (bookmark.content.type) {
    case "link":
      return <LinkCard key={bookmark.id} bookmark={bookmark} />;
  }
}

export const dynamic = "force-dynamic";

export default function BookmarksGrid({
  query,
  bookmarks: initialBookmarks,
}: {
  query: ZGetBookmarksRequest;
  bookmarks: ZBookmark[];
}) {
  const { data } = api.bookmarks.getBookmarks.useQuery(query, {
    initialData: { bookmarks: initialBookmarks },
    staleTime: Infinity,
  });
  const { loading } = useLoadingCard();
  return (
    <div className="container grid grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {loading && <BookmarkCardSkeleton />}
      {data.bookmarks.map((b) => renderBookmark(b))}
    </div>
  );
}
