import { redirect } from "next/navigation";
import BookmarksGrid from "./BookmarksGrid";
import { ZGetBookmarksRequest } from "@/lib/types/api/bookmarks";
import { api } from "@/server/api/client";
import { getServerAuthSession } from "@/server/auth";

export default async function Bookmarks({
  favourited,
  archived,
  title,
}: ZGetBookmarksRequest & { title: string }) {
  const session = await getServerAuthSession();
  if (!session) {
    redirect("/");
  }

  const query = {
    favourited,
    archived,
  };

  const bookmarks = await api.bookmarks.getBookmarks(query);

  // TODO: This needs to be polished
  return (
    <>
      <div className="container pb-4 text-2xl">{title}</div>
      <div className="container">
        {bookmarks.bookmarks.length == 0 ? (
          "No bookmarks"
        ) : (
          <BookmarksGrid query={query} bookmarks={bookmarks.bookmarks} />
        )}
      </div>
    </>
  );
}
