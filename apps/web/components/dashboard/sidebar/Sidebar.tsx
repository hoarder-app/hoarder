import Link from "next/link";
import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { api } from "@/server/api/client";
import { getServerAuthSession } from "@/server/auth";
import { Home, PackageOpen, Search, Settings, Shield, Tag } from "lucide-react";

import serverConfig from "@hoarder/shared/config";

import AllLists from "./AllLists";
import SidebarItem from "./SidebarItem";
import SidebarProfileOptions from "./SidebarProfileOptions";

export default async function Sidebar() {
  const session = await getServerAuthSession();
  if (!session) {
    redirect("/");
  }

  const lists = await api.lists.list();

  return (
    <aside className="flex h-screen w-60 flex-col gap-5 border-r p-4">
      <Link href={"/dashboard/bookmarks"}>
        <div className="flex items-center rounded-lg px-1 text-slate-900">
          <PackageOpen />
          <span className="ml-2 text-base font-semibold">Hoarder</span>
        </div>
      </Link>
      <hr />
      <div>
        <ul className="space-y-2 text-sm font-medium">
          <SidebarItem
            logo={<Home />}
            name="Home"
            path="/dashboard/bookmarks"
          />
          {serverConfig.meilisearch && (
            <SidebarItem
              logo={<Search />}
              name="Search"
              path="/dashboard/search"
            />
          )}
          <SidebarItem logo={<Tag />} name="Tags" path="/dashboard/tags" />
          <SidebarItem
            logo={<Settings />}
            name="Settings"
            path="/dashboard/settings"
          />
          {session.user.role == "admin" && (
            <SidebarItem
              logo={<Shield />}
              name="Admin"
              path="/dashboard/admin"
            />
          )}
        </ul>
      </div>
      <Separator />
      <AllLists initialData={lists} />
      <div className="mt-auto flex justify-between justify-self-end">
        <div className="my-auto"> {session.user.name} </div>
        <SidebarProfileOptions />
      </div>
    </aside>
  );
}
