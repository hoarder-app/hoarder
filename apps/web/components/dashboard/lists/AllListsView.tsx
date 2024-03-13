"use client";

import Link from "next/link";
import { useNewListModal } from "@/components/dashboard/sidebar/NewListModal";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/trpc";
import { keepPreviousData } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import type { ZBookmarkList } from "@hoarder/trpc/types/lists";

function ListItem({
  name,
  icon,
  path,
}: {
  name: string;
  icon: string;
  path: string;
}) {
  return (
    <Link href={path}>
      <div className="rounded-md border border-gray-200 bg-background px-4 py-2 text-lg">
        <p className="text-nowrap">
          {icon} {name}
        </p>
      </div>
    </Link>
  );
}

export default function AllListsView({
  initialData,
}: {
  initialData: ZBookmarkList[];
}) {
  const { setOpen: setIsNewListModalOpen } = useNewListModal();
  let { data: lists } = api.lists.list.useQuery(undefined, {
    initialData: { lists: initialData },
    placeholderData: keepPreviousData,
  });

  // TODO: This seems to be a bug in react query
  lists ||= { lists: initialData };

  return (
    <div className="flex flex-col flex-wrap gap-2 md:flex-row">
      <Button
        className="my-auto flex h-full"
        onClick={() => setIsNewListModalOpen(true)}
      >
        <Plus />
        <span className="my-auto">New List</span>
      </Button>
      <ListItem name="Favourites" icon="⭐️" path={`/dashboard/favourites`} />
      <ListItem name="Archive" icon="🗄️" path={`/dashboard/archive`} />
      {lists.lists.map((l) => (
        <ListItem
          key={l.id}
          name={l.name}
          icon={l.icon}
          path={`/dashboard/lists/${l.id}`}
        />
      ))}
    </div>
  );
}
