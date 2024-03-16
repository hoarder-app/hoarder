import Bookmarks from "@/components/dashboard/bookmarks/Bookmarks";

export default async function BookmarksPage() {
  return <Bookmarks title="Bookmarks" archived={false} showEditorCard={true} />;
}
