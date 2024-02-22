import MobileSidebarItem from "./ModileSidebarItem";
import { Archive, Star, Tag, PackageOpen, Settings } from "lucide-react";
import SidebarProfileOptions from "./SidebarProfileOptions";

export default async function MobileSidebar() {
  return (
    <aside className="w-full">
      <ul className="flex justify-between space-x-2 border-b-black bg-gray-100 px-5 py-2 pt-5">
        <MobileSidebarItem logo={<PackageOpen />} path="/dashboard/bookmarks" />
        <MobileSidebarItem
          logo={<Star />}
          path="/dashboard/bookmarks/favourites"
        />
        <MobileSidebarItem
          logo={<Archive />}
          path="/dashboard/bookmarks/archive"
        />
        <MobileSidebarItem logo={<Tag />} path="/dashboard/tags" />
        <MobileSidebarItem logo={<Settings />} path="/dashboard/settings" />
        <SidebarProfileOptions />
      </ul>
    </aside>
  );
}
