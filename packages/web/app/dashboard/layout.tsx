import Bookmarks from "@/app/dashboard/bookmarks/page";
import Sidebar from "@/app/dashboard/components/Sidebar";

export default async function Dashboard() {
  return (
    <div className="flex h-screen w-screen">
      <div className="flex-none">
        <Sidebar />
      </div>
      <div className="flex-1 bg-gray-100">
        <Bookmarks />
      </div>
    </div>
  );
}
