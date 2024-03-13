import { redirect } from "next/navigation";
import { api } from "@/server/api/client";
import { getServerAuthSession } from "@/server/auth";

import type { ZGetBookmarksRequest } from "@hoarder/trpc/types/bookmarks";

import BookmarksGrid from "./BookmarksGrid";

export default async function Bookmarks({
  favourited,
  archived,
  title,
  showDivider,
}: ZGetBookmarksRequest & { title: string; showDivider?: boolean }) {
  const session = await getServerAuthSession();
  if (!session) {
    redirect("/");
  }

  const query = {
    favourited,
    archived,
  };

  const bookmarks = await api.bookmarks.getBookmarks(query);

  return (
    <div className="container flex flex-col gap-3">
      <div className="text-2xl">{title}</div>
      {showDivider && <hr />}
      <BookmarksGrid query={query} bookmarks={bookmarks.bookmarks} />
    </div>
  );
}
