import Bookmarks from "../components/Bookmarks";

export default async function FavouritesBookmarkPage() {
  return <Bookmarks title="Favourites" archived={false} favourited={true} />;
}
