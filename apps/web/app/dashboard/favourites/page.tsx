import Bookmarks from "@/components/dashboard/bookmarks/Bookmarks";

export default async function FavouritesBookmarkPage() {
  return (
    <Bookmarks
      header={<p className="text-2xl">⭐️ Favourites</p>}
      query={{ favourited: true }}
      showDivider={true}
      showEditorCard={true}
    />
  );
}
