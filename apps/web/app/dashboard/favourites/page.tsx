import Bookmarks from "@/components/dashboard/bookmarks/Bookmarks";
import ChangeLayout from "@/components/dashboard/ChangeLayout";

export default async function FavouritesBookmarkPage() {
  return (
    <Bookmarks
      header={
        <div className="flex items-center justify-between">
          <p className="text-2xl">⭐️ Favourites</p>
          <ChangeLayout />
        </div>
      }
      query={{ favourited: true }}
      showDivider={true}
      showEditorCard={true}
    />
  );
}
