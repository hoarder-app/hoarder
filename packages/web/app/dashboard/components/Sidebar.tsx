import { Button } from "@/components/ui/button";
import { Archive, MoreHorizontal, Star, Tag, Home, Brain } from "lucide-react";
import { redirect } from "next/navigation";
import SidebarItem from "./SidebarItem";
import { getServerAuthSession } from "@/server/auth";

export default async function Sidebar() {
  const session = await getServerAuthSession();
  if (!session) {
    redirect("/");
  }

  return (
    <aside className="flex h-full w-60 flex-col border-r p-4">
      <div className="mb-5 flex items-center rounded-lg px-1 text-slate-900">
        <Brain />
        <span className="ml-2 text-base font-semibold">Remember</span>
      </div>
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
          <SidebarItem logo={<Tag />} name="Tags" path="#" />
        </ul>
      </div>
      <div className="mt-auto flex justify-between">
        <div className="my-auto"> {session.user.name} </div>
        <Button variant="ghost" className="h-10">
          <MoreHorizontal />
        </Button>
      </div>
    </aside>
  );
}
