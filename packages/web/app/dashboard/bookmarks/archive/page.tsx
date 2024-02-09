import Bookmarks from "../components/Bookmarks";

export default async function ArchivedBookmarkPage() {
  return <Bookmarks title="Archive" archived={true} favourited={false} />;
}
