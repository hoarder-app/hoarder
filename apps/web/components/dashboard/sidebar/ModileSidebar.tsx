import Image from "next/image";
import MobileSidebarItem from "@/components/shared/sidebar/ModileSidebarItem";
import hoarderLogoIcon from "@/public/icons/logo-icon.svg";
import { ClipboardList, Search, Tag } from "lucide-react";

export default async function MobileSidebar() {
  return (
    <aside className="w-full">
      <ul className="flex justify-between space-x-2 border-b-black px-5 py-2 pt-5">
        <MobileSidebarItem
          logo={
            <Image
              alt="Hoarder Logo"
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              src={hoarderLogoIcon}
              className="w-5 fill-foreground"
            />
          }
          path="/dashboard/bookmarks"
        />
        <MobileSidebarItem logo={<Search />} path="/dashboard/search" />
        <MobileSidebarItem logo={<ClipboardList />} path="/dashboard/lists" />
        <MobileSidebarItem logo={<Tag />} path="/dashboard/tags" />
      </ul>
    </aside>
  );
}
