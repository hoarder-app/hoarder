"use client";

import { api } from "@/lib/trpc";
import SidebarItem from "./SidebarItem";
import LoadingSpinner from "@/components/ui/spinner";
import NewListModal, { useNewListModal } from "./NewListModal";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function AllLists() {
  const { data: lists } = api.lists.list.useQuery();

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
      {lists && lists.lists.length == 0 && <li>No lists</li>}
      {lists ? (
        lists.lists.map((l) => (
          <SidebarItem
            key={l.id}
            logo={<span className="text-lg"> {l.icon}</span>}
            name={l.name}
            path={`/dashboard/lists/${l.id}`}
            className="py-0.5"
          />
        ))
      ) : (
        <LoadingSpinner />
      )}
    </ul>
  );
}
