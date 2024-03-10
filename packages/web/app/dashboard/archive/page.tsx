import Bookmarks from "@/components/dashboard/bookmarks/Bookmarks";

export default async function ArchivedBookmarkPage() {
  return (
    <div className="continer mt-4">
      <Bookmarks title="🗄️ Archive" archived={true} showDivider={true} />
    </div>
  );
}
