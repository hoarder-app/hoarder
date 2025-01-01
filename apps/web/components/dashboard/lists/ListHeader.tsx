"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";

import { api } from "@hoarder/shared-react/trpc";
import { parseSearchQuery } from "@hoarder/shared/searchQueryParser";
import { ZBookmarkList } from "@hoarder/shared/types/lists";

import QueryExplainerTooltip from "../search/QueryExplainerTooltip";
import { ListOptions } from "./ListOptions";

export default function ListHeader({
  initialData,
}: {
  initialData: ZBookmarkList;
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

  const parsedQuery = useMemo(() => {
    if (!list.query) {
      return null;
    }
    return parseSearchQuery(list.query);
  }, [list.query]);

  if (error) {
    // This is usually exercised during list deletions.
    if (error.data?.code == "NOT_FOUND") {
      router.push("/dashboard/lists");
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-2xl">
          {list.icon} {list.name}
        </span>
        {parsedQuery && (
          <QueryExplainerTooltip parsedSearchQuery={parsedQuery} />
        )}
      </div>
      <div className="flex">
        <ListOptions list={list}>
          <Button variant="ghost">
            <MoreHorizontal />
          </Button>
        </ListOptions>
      </div>
    </div>
  );
}
