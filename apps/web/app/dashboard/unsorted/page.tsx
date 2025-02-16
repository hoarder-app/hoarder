import Bookmarks from "@/components/dashboard/bookmarks/Bookmarks";

function header() {
  return (
    <div className="flex gap-2">
      <p className="text-2xl">📂 Unsorted</p>
    </div>
  );
}

export default async function UnsortedBookmarkPage() {
  return (
    <Bookmarks
      header={header()}
      query={{ list: null }}
      showDivider={true}
      showEditorCard={true}
    />
  );
}
