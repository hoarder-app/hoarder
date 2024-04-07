import BookmarkPreview from "@/components/dashboard/preview/BookmarkPreview";
import { api } from "@/server/api/client";

export default async function BookmarkPreviewPage({
  params,
}: {
  params: { bookmarkId: string };
}) {
  const bookmark = await api.bookmarks.getBookmark({
    bookmarkId: params.bookmarkId,
  });

  return (
    <div className="max-h-screen">
      <BookmarkPreview initialData={bookmark} />
    </div>
  );
}
