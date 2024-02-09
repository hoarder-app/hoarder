import Bookmarks from "./components/Bookmarks";

export default async function BookmarksPage() {
  return <Bookmarks title="Bookmarks" archived={false} favourited={false} />;
}
