"use client";

import { useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CollapsibleTriggerTriangle } from "@/components/ui/collapsible";
import { MoreHorizontal, Plus } from "lucide-react";

import type { ZBookmarkList } from "@hoarder/shared/types/lists";
import { ZBookmarkListTreeNode } from "@hoarder/shared/utils/listUtils";

import { CollapsibleBookmarkLists } from "../lists/CollapsibleBookmarkLists";
import { EditListModal } from "../lists/EditListModal";
import { ListOptions } from "../lists/ListOptions";
import SidebarItem from "./SidebarItem";

export default function AllLists({
  initialData,
}: {
  initialData: { lists: ZBookmarkList[] };
}) {
  const pathName = usePathname();
  const isNodeOpen = useCallback(
    (node: ZBookmarkListTreeNode) => pathName.includes(node.item.id),
    [pathName],
  );
  return (
    <ul className="max-h-full gap-y-2 overflow-auto text-sm font-medium">
      <li className="flex justify-between pb-2 font-bold">
        <p>Lists</p>
        <EditListModal>
          <Link href="#">
            <Plus />
          </Link>
        </EditListModal>
      </li>
      <SidebarItem
        logo={<span className="text-lg">📋</span>}
        name="All Lists"
        path={`/dashboard/lists`}
        linkClassName="py-0.5"
      />
      <SidebarItem
        logo={<span className="text-lg">⭐️</span>}
        name="Favourites"
        path={`/dashboard/favourites`}
        linkClassName="py-0.5"
      />
      <SidebarItem
        logo={<span className="text-lg">🗄️</span>}
        name="Archive"
        path={`/dashboard/archive`}
        linkClassName="py-0.5"
      />

      {
        <CollapsibleBookmarkLists
          initialData={initialData.lists}
          isOpenFunc={isNodeOpen}
          render={({ item: node, level, open }) => (
            <SidebarItem
              collapseButton={
                node.children.length > 0 && (
                  <CollapsibleTriggerTriangle
                    className="absolute left-0 top-1/2 size-2 -translate-y-1/2"
                    open={open}
                  />
                )
              }
              logo={
                <span className="flex">
                  <span className="text-lg"> {node.item.icon}</span>
                </span>
              }
              name={node.item.name}
              path={`/dashboard/lists/${node.item.id}`}
              right={
                <ListOptions list={node.item}>
                  <Button
                    size="none"
                    variant="ghost"
                    className="invisible group-hover:visible"
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                </ListOptions>
              }
              linkClassName="group py-0.5"
              style={{ marginLeft: `${level * 1}rem` }}
            />
          )}
        />
      }
    </ul>
  );
}
