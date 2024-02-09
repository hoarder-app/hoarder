import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getBookmarks } from "@/lib/services/bookmarks";
import LinkCard from "./LinkCard";
import { ZBookmark } from "@/lib/types/api/bookmarks";

function renderBookmark(bookmark: ZBookmark) {
  switch (bookmark.content.type) {
    case "link":
      return <LinkCard key={bookmark.id} bookmark={bookmark} />;
  }
}

export default async function BookmarksGrid() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/");
  }
  const bookmarks = await getBookmarks(session.user.id);

  return (
    <div className="container grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {bookmarks.map((b) => renderBookmark(b))}
    </div>
  );
}
