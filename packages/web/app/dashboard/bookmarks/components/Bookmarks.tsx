import { redirect } from "next/navigation";
import BookmarksGrid from "./BookmarksGrid";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { getBookmarks } from "@/lib/services/bookmarks";
import { ZGetBookmarksRequest } from "@/lib/types/api/bookmarks";

export default async function Bookmarks({
  favourited,
  archived,
  title,
}: ZGetBookmarksRequest & { title: string }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/");
  }
  const bookmarks = await getBookmarks(session.user.id, {
    favourited,
    archived,
  });

  if (bookmarks.length == 0) {
    // TODO: This needs to be polished
    return (
      <>
        <div className="container pb-4 text-2xl">{title}</div>
        <div className="container">No bookmarks</div>
      </>
    );
  }

  return (
    <>
      <div className="container pb-4 text-2xl">{title}</div>
      <BookmarksGrid bookmarks={bookmarks} />
    </>
  );
}
