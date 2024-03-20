import Bookmarks from "@/components/dashboard/bookmarks/Bookmarks";

export default async function FavouritesBookmarkPage() {
  return (
    <div className="continer mt-4">
      <Bookmarks
        header={<p className="text-2xl">⭐️ Favourites</p>}
        query={{ favourited: true, archived: false }}
        showDivider={true}
      />
    </div>
  );
}
