"use client";

import { useRouter } from "next/navigation";
import GlobalActions from "@/components/dashboard/GlobalActions";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";

import { api } from "@hoarder/shared-react/trpc";
import { ZBookmarkList } from "@hoarder/shared/types/lists";

import { ListOptions } from "./ListOptions";

export default function ListHeader({
  initialData,
}: {
  initialData: ZBookmarkList & { bookmarks: string[] };
}) {
  const router = useRouter();
  const { data: list, error } = api.lists.get.useQuery(
    {
      listId: initialData.id,
    },
    {
      initialData,
    },
  );

  if (error) {
    // This is usually exercised during list deletions.
    if (error.data?.code == "NOT_FOUND") {
      router.push("/dashboard/lists");
    }
  }

  return (
    <div className="w-100 container space-y-4 rounded-md border bg-background bg-opacity-60 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-orange-500">
          <span className="text-2xl">{list.icon}</span>
          <p className="text-2xl">{list.name}</p>
        </div>
        <div className="relative flex w-max items-center space-x-2">
          <ListOptions list={list}>
            <Button variant="ghost">
              <MoreHorizontal />
            </Button>
          </ListOptions>
          <GlobalActions />
        </div>
      </div>
    </div>
  );
}
