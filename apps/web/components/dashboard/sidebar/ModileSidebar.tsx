import ProfileOptions from "@/components/dashboard/header/ProfileOptions";
import HoarderLogoIcon from "@/public/icons/logo-icon.svg";
import { ClipboardList, Search, Settings, Tag } from "lucide-react";

import MobileSidebarItem from "./ModileSidebarItem";

export default async function MobileSidebar() {
  return (
    <aside className="w-full">
      <ul className="flex justify-between space-x-2 border-b-black px-5 py-2 pt-5">
        <MobileSidebarItem
          logo={<HoarderLogoIcon className="w-5 fill-foreground" />}
          path="/dashboard/bookmarks"
        />
        <MobileSidebarItem logo={<Search />} path="/dashboard/search" />
        <MobileSidebarItem logo={<ClipboardList />} path="/dashboard/lists" />
        <MobileSidebarItem logo={<Tag />} path="/dashboard/tags" />
        <MobileSidebarItem logo={<Settings />} path="/dashboard/settings" />
        <ProfileOptions />
      </ul>
    </aside>
  );
}
