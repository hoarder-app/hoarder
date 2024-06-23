import Link from "next/link";
import { redirect } from "next/navigation";
import HoarderLogo from "@/components/HoarderIcon";
import { Separator } from "@/components/ui/separator";
import { api } from "@/server/api/client";
import { getServerAuthSession } from "@/server/auth";
import { Home, Search, Settings, Shield, Tag } from "lucide-react";

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

  const searchItem = serverConfig.meilisearch
    ? [
        {
          name: "Search",
          icon: <Search size={18} />,
          path: "/dashboard/search",
        },
      ]
    : [];

  const adminItem =
    session.user.role == "admin"
      ? [
          {
            name: "Admin",
            icon: <Shield size={18} />,
            path: "/dashboard/admin",
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
      name: "Settings",
      icon: <Settings size={18} />,
      path: "/dashboard/settings",
    },
    ...adminItem,
  ];

  return (
    <aside className="flex h-screen w-60 flex-col gap-5 border-r p-4">
      <Link href={"/dashboard/bookmarks"}>
        <HoarderLogo height={20} gap="8px" />
      </Link>
      <Separator />
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
      <div className="mt-auto flex justify-between justify-self-end">
        <div className="my-auto"> {session.user.name} </div>
        <SidebarProfileOptions />
      </div>
    </aside>
  );
}
