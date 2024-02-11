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

  // TODO: Migrate to a server side call in trpc instead
  const bookmarks = await api.bookmarks.getBookmarks({
    favourited,
    archived,
  });

  if (bookmarks.bookmarks.length == 0) {
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
      <BookmarksGrid bookmarks={bookmarks.bookmarks} />
    </>
  );
}
