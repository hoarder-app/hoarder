import { redirect } from "next/navigation";
import SidebarItem from "@/components/shared/sidebar/SidebarItem";
import { Separator } from "@/components/ui/separator";
import { api } from "@/server/api/client";
import { getServerAuthSession } from "@/server/auth";
import { Archive, Home, Search, Tag } from "lucide-react";

import serverConfig from "@hoarder/shared/config";

import AllLists from "./AllLists";

export default async function Sidebar() {
  const session = await getServerAuthSession();
  if (!session) {
    redirect("/");
  }

  const lists = await api.lists.list();

  const searchItem = serverConfig.meilisearch
    ? [
        {
          name: "Search",
          icon: <Search size={18} />,
          path: "/dashboard/search",
        },
      ]
    : [];

  const menu: {
    name: string;
    icon: JSX.Element;
    path: string;
  }[] = [
    {
      name: "Home",
      icon: <Home size={18} />,
      path: "/dashboard/bookmarks",
    },
    ...searchItem,
    {
      name: "Tags",
      icon: <Tag size={18} />,
      path: "/dashboard/tags",
    },
    {
      name: "Archive",
      icon: <Archive size={18} />,
      path: "/dashboard/archive",
    },
  ];

  return (
    <aside className="flex h-[calc(100vh-64px)] w-60 flex-col gap-5 border-r p-4 ">
      <div>
        <ul className="space-y-2 text-sm font-medium">
          {menu.map((item) => (
            <SidebarItem
              key={item.name}
              logo={item.icon}
              name={item.name}
              path={item.path}
            />
          ))}
        </ul>
      </div>
      <Separator />
      <AllLists initialData={lists} />
      <div className="mt-auto flex items-center border-t pt-2 text-sm text-gray-400">
        Hoarder v{serverConfig.serverVersion}
      </div>
    </aside>
  );
}
