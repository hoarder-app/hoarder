import BookmarkPreview from "@/components/dashboard/bookmarks/BookmarkPreview";
import { api } from "@/server/api/client";

export default async function BookmarkPreviewPage({
  params,
}: {
  params: { bookmarkId: string };
}) {
  const bookmark = await api.bookmarks.getBookmark({
    bookmarkId: params.bookmarkId,
  });

  return <BookmarkPreview initialData={bookmark} />;
}
