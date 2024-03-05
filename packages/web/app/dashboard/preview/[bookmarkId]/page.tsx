import { api } from "@/server/api/client";
import BookmarkPreview from "./components/BookmarkPreview";

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
