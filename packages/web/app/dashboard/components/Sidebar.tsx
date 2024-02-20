import { Archive, Star, Tag, Home, PackageOpen, Settings } from "lucide-react";
import { redirect } from "next/navigation";
import SidebarItem from "./SidebarItem";
import { getServerAuthSession } from "@/server/auth";
import Link from "next/link";
import SidebarProfileOptions from "./SidebarProfileOptions";

export default async function Sidebar() {
  const session = await getServerAuthSession();
  if (!session) {
    redirect("/");
  }

  return (
    <aside className="flex h-full w-60 flex-col border-r p-4">
      <Link href={"/dashboard/bookmarks"}>
        <div className="mb-5 flex items-center rounded-lg px-1 text-slate-900">
          <PackageOpen />
          <span className="ml-2 text-base font-semibold">Hoarder</span>
        </div>
      </Link>
      <hr />
      <div>
        <ul className="mt-5 space-y-2 text-sm font-medium">
          <SidebarItem
            logo={<Home />}
            name="Home"
            path="/dashboard/bookmarks"
          />
          <SidebarItem
            logo={<Star />}
            name="Favourites"
            path="/dashboard/bookmarks/favourites"
          />
          <SidebarItem
            logo={<Archive />}
            name="Archive"
            path="/dashboard/bookmarks/archive"
          />
          <SidebarItem logo={<Tag />} name="Tags" path="/dashboard/tags" />
          <SidebarItem
            logo={<Settings />}
            name="Settings"
            path="/dashboard/settings"
          />
        </ul>
      </div>
      <div className="mt-auto flex justify-between">
        <div className="my-auto"> {session.user.name} </div>
        <SidebarProfileOptions />
      </div>
    </aside>
  );
}
