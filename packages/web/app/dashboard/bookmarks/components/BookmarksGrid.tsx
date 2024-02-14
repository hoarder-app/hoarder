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
  return (
    <div className="container grid grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {bookmarks.map((b) => renderBookmark(b))}
    </div>
  );
}
