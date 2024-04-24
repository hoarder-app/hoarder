import { notFound } from "next/navigation";
import BookmarkPreview from "@/components/dashboard/preview/BookmarkPreview";
import { api } from "@/server/api/client";
import { TRPCError } from "@trpc/server";

export default async function BookmarkPreviewPage({
  params,
}: {
  params: { bookmarkId: string };
}) {
  let bookmark;
  try {
    bookmark = await api.bookmarks.getBookmark({
      bookmarkId: params.bookmarkId,
    });
  } catch (e) {
    if (e instanceof TRPCError) {
      if (e.code === "NOT_FOUND") {
        notFound();
      }
    }
    throw e;
  }

  return (
    <div className="max-h-screen">
      <BookmarkPreview bookmarkId={bookmark.id} initialData={bookmark} />
    </div>
  );
}
