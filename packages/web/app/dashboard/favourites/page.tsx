import Bookmarks from "@/components/dashboard/bookmarks/Bookmarks";

export default async function FavouritesBookmarkPage() {
  return (
    <div className="continer mt-4">
      <Bookmarks
        title="⭐️ Favourites"
        archived={false}
        favourited={true}
        showDivider={true}
      />
    </div>
  );
}
