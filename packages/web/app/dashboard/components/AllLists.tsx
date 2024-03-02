"use client";

import { api } from "@/lib/trpc";
import SidebarItem from "./SidebarItem";
import LoadingSpinner from "@/components/ui/spinner";
import NewListModal, { useNewListModal } from "./NewListModal";
import { Plus } from "lucide-react";
import Link from "next/link";
import { ZBookmarkList } from "@/lib/types/api/lists";

export default function AllLists({initialData}: {initialData: {lists: ZBookmarkList[]}}) {
  const { data: lists } = api.lists.list.useQuery(undefined, {
    initialData,
  });

  const { setOpen } = useNewListModal();

  return (
    <ul className="max-h-full gap-y-2 overflow-auto text-sm font-medium">
      <NewListModal />
      <li className="flex justify-between pb-2 font-bold">
        <p>Lists</p>
        <Link href="#" onClick={() => setOpen(true)}>
          <Plus />
        </Link>
      </li>
      <SidebarItem
        logo={<span className="text-lg">📋</span>}
        name="All Lists"
        path={`/dashboard/lists`}
        className="py-0.5"
      />
      <SidebarItem
        logo={<span className="text-lg">⭐️</span>}
        name="Favourties"
        path={`/dashboard/favourites`}
        className="py-0.5"
      />
      <SidebarItem
        logo={<span className="text-lg">🗄️</span>}
        name="Archive"
        path={`/dashboard/archive`}
        className="py-0.5"
      />
      {lists.lists.map((l) => (
        <SidebarItem
          key={l.id}
          logo={<span className="text-lg"> {l.icon}</span>}
          name={l.name}
          path={`/dashboard/lists/${l.id}`}
          className="py-0.5"
        />
      ))}
    </ul>
  );
}
