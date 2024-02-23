import { getServerAuthSession } from "@/server/auth";
import { db } from "@hoarder/db";
import { notFound, redirect } from "next/navigation";
import BookmarksGrid from "../../bookmarks/components/BookmarksGrid";
import { api } from "@/server/api/client";
import { bookmarkTags, tagsOnBookmarks } from "@hoarder/db/schema";
import { and, eq } from "drizzle-orm";

export default async function TagPage({
  params,
}: {
  params: { tagName: string };
}) {
  const session = await getServerAuthSession();
  if (!session) {
    redirect("/");
  }
  const tag = await db.query.bookmarkTags.findFirst({
    where: and(
      eq(bookmarkTags.userId, session.user.id),
      eq(bookmarkTags.name, params.tagName),
    ),
    columns: {
      id: true,
    },
  });

  if (!tag) {
    // TODO: Better error message when the tag is not there
    notFound();
  }

  const bookmarkIds = await db.query.tagsOnBookmarks.findMany({
    where: eq(tagsOnBookmarks.tagId, tag.id),
    columns: {
      bookmarkId: true,
    },
  });

  const query = {
    ids: bookmarkIds.map((b) => b.bookmarkId),
    archived: false,
  };

  const bookmarks = await api.bookmarks.getBookmarks(query);

  return (
    <div className="flex flex-col">
      <span className="container py-4 text-2xl">#{params.tagName}</span>
      <BookmarksGrid query={query} bookmarks={bookmarks.bookmarks} />
    </div>
  );
}
