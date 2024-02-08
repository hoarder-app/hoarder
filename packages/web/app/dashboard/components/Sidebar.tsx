import { Button } from "@/components/ui/button";
import { authOptions } from "@/lib/auth";
import { Archive, MoreHorizontal, Star, Tag, Home, Brain } from "lucide-react";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

function SidebarItem({
  name,
  logo,
  path,
}: {
  name: string;
  logo: React.ReactNode;
  path: string;
}) {
  return (
    <li className="rounded-lg px-3 py-2 hover:bg-slate-100">
      <Link href={path} className="flex w-full space-x-2">
        {logo}
        <span className="my-auto"> {name} </span>
      </Link>
    </li>
  );
}

export default async function Sidebar() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/");
  }

  return (
    <aside className="flex flex-col h-full w-60 border-r p-4">
      <div className="flex px-1 mb-5 items-center rounded-lg text-slate-900">
        <Brain />
        <span className="ml-2 text-base font-semibold">Remember</span>
      </div>
      <hr />
      <div>
        <ul className="space-y-2 mt-5 text-sm font-medium">
          <SidebarItem logo={<Home />} name="Home" path="#" />
          <SidebarItem logo={<Star />} name="Favourites" path="#" />
          <SidebarItem logo={<Archive />} name="Archived" path="#" />
          <SidebarItem logo={<Tag />} name="Tags" path="#" />
        </ul>
      </div>
      <div className="mt-auto flex justify-between">
        <div className="my-auto"> {session.user.name} </div>
        <Button variant="ghost" className="h-10 w-30">
          <MoreHorizontal />
        </Button>
      </div>
    </aside>
  );
}
