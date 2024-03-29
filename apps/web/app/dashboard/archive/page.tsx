import Bookmarks from "@/components/dashboard/bookmarks/Bookmarks";

export default async function ArchivedBookmarkPage() {
  return (
    <Bookmarks
      header={<p className="text-2xl">🗄️ Archive</p>}
      query={{ archived: true }}
      showDivider={true}
    />
  );
}
