"use client";

import { useLoadingCard } from "@/lib/hooks/use-loading-card";
import BookmarkCardSkeleton from "./BookmarkCardSkeleton";
import LinkCard from "./LinkCard";
import { ZBookmark } from "@/lib/types/api/bookmarks";

function renderBookmark(bookmark: ZBookmark) {
  switch (bookmark.content.type) {
    case "link":
      return <LinkCard key={bookmark.id} bookmark={bookmark} />;
  }
}

export default function BookmarksGrid({
  bookmarks,
}: {
  bookmarks: ZBookmark[];
}) {
  const { loading } = useLoadingCard();
  return (
    <div className="container grid grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {loading && <BookmarkCardSkeleton />}
      {bookmarks.map((b) => renderBookmark(b))}
    </div>
  );
}
