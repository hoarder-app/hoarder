import { notFound, redirect } from "next/navigation";
import BookmarksGrid from "@/components/dashboard/bookmarks/BookmarksGrid";
import { api } from "@/server/api/client";
import { getServerAuthSession } from "@/server/auth";
import { TRPCError } from "@trpc/server";

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

  let tag;
  try {
    tag = await api.tags.get({ tagName });
  } catch (e) {
    if (e instanceof TRPCError) {
      if (e.code == "NOT_FOUND") {
        notFound();
      }
    }
    throw e;
  }

  const query = {
    archived: false,
    tagId: tag.id,
  };

  const bookmarks = await api.bookmarks.getBookmarks(query);

  return (
    <div className="container flex flex-col gap-3">
      <span className="pt-4 text-2xl">{tagName}</span>
      <hr />
      <BookmarksGrid query={query} bookmarks={bookmarks} />
    </div>
  );
}
