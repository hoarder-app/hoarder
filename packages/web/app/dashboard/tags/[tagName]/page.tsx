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
  const tagName = decodeURIComponent(params.tagName);
  const tag = await db.query.bookmarkTags.findFirst({
    where: and(
      eq(bookmarkTags.userId, session.user.id),
      eq(bookmarkTags.name, tagName),
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
    <div className="container flex flex-col gap-3">
      <span className="pt-4 text-2xl">{tagName}</span>
      <hr />
      <BookmarksGrid query={query} bookmarks={bookmarks.bookmarks} />
    </div>
  );
}
