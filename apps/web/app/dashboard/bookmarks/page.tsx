import Bookmarks from "@/components/dashboard/bookmarks/Bookmarks";

export default async function BookmarksPage() {
  return (
    <Bookmarks
      header={<p className="text-2xl">Bookmarks</p>}
      query={{ archived: false }}
      showEditorCard={true}
    />
  );
}
