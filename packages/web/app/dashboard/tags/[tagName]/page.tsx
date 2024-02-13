import { getServerAuthSession } from "@/server/auth";
import { prisma } from "@remember/db";
import { notFound, redirect } from "next/navigation";
import BookmarksGrid from "../../bookmarks/components/BookmarksGrid";
import { api } from "@/server/api/client";

export default async function TagPage({
  params,
}: {
  params: { tagName: string };
}) {
  const session = await getServerAuthSession();
  if (!session) {
    redirect("/");
  }
  const tag = await prisma.bookmarkTags.findUnique({
    where: {
      userId: session.user.id,
      name: params.tagName,
    },
    select: {
      id: true,
    },
  });

  if (!tag) {
    // TODO: Better error message when the tag is not there
    notFound();
  }

  const bookmarkIds = await prisma.tagsOnBookmarks.findMany({
    where: {
      tagId: tag.id,
    },
    select: {
      bookmarkId: true,
    },
  });

  const bookmarks = await api.bookmarks.getBookmarksById({
    ids: bookmarkIds.map((b) => b.bookmarkId),
    archived: false,
  });

  return (
    <div className="flex flex-col">
      <span className="container py-4 text-2xl">#{params.tagName}</span>
      <BookmarksGrid bookmarks={bookmarks.bookmarks} />
    </div>
  );
}
