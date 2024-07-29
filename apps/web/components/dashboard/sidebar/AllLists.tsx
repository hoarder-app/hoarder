"use client";

import { useCallback, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CollapsibleTriggerTriangle } from "@/components/ui/collapsible";
import { Archive, Clipboard, MoreHorizontal, Plus, Star } from "lucide-react";

import type { ZBookmarkList } from "@hoarder/shared/types/lists";
import { ZBookmarkListTreeNode } from "@hoarder/shared/utils/listUtils";

import { CollapsibleBookmarkLists } from "../lists/CollapsibleBookmarkLists";
import { EditListModal } from "../lists/EditListModal";
import { ListOptions } from "../lists/ListOptions";
import SidebarItem from "./SidebarItem";

export default function AllLists({
  initialData,
  isCollapsed = false,
}: {
  initialData: { lists: ZBookmarkList[] };
  isCollapsed?: boolean;
}) {
  const pathName = usePathname();

  const isNodeOpen = useCallback(
    (node: ZBookmarkListTreeNode) => pathName.includes(node.item.id),
    [pathName],
  );

  const { lists } = initialData;

  useEffect(() => {
    //console.log("initialData:", initialData);
  }, [initialData]);

  return (
    <ul className="max-h-full gap-y-4 overflow-auto pt-5 text-sm font-medium">
      <li
        className={`flex ${isCollapsed ? "justify-center" : "justify-between"} pb-2 font-bold`}
      >
        {!isCollapsed && <p className="text-orange-500">Lists</p>}
      </li>
      <SidebarItem
        logo={<Clipboard className="mr-2 text-lg" />}
        name={!isCollapsed ? "All Lists" : ""}
        path={`/dashboard/lists`}
        isCollapsed={isCollapsed}
        className="py-3"
        style={{
          paddingLeft: isCollapsed ? "1.5rem" : "1rem",
          justifyContent: isCollapsed ? "center" : "flex-start",
        }}
      />
      <SidebarItem
        logo={<Star className="mr-2 text-lg" />}
        name={!isCollapsed ? "Favourites" : ""}
        path={`/dashboard/favourites`}
        isCollapsed={isCollapsed}
        className="py-3"
        style={{
          paddingLeft: isCollapsed ? "1.5rem" : "1rem",
          justifyContent: isCollapsed ? "center" : "flex-start",
        }}
      />
      <SidebarItem
        logo={<Archive className="mr-2 text-lg" />}
        name={!isCollapsed ? "Archive" : ""}
        path={`/dashboard/archive`}
        isCollapsed={isCollapsed}
        className="py-3"
        style={{
          paddingLeft: isCollapsed ? "1.5rem" : "1rem",
          justifyContent: isCollapsed ? "center" : "flex-start",
        }}
      />
      <EditListModal>
        <Link
          href="#"
          className={`flex items-center ${isCollapsed ? "justify-center" : "justify-start"} w-full`}
          style={{ paddingLeft: isCollapsed ? "1.5rem" : "1rem" }}
        >
          <Plus
            className="my-6 text-orange-500"
            style={{ marginLeft: isCollapsed ? "-2.0rem" : "0" }}
          />
          {!isCollapsed && (
            <span className="ml-2 text-gray-900 dark:text-white">New List</span>
          )}
        </Link>
      </EditListModal>
      {lists && lists.length > 0 ? (
        <CollapsibleBookmarkLists
          initialData={lists}
          isOpenFunc={isNodeOpen}
          render={({ item: node, level, open }) => (
            <SidebarItem
              key={node.item.id}
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
                  <span className={`text-lg ${!isCollapsed ? "ml-5" : ""}`}>
                    {node.item.icon}
                  </span>
                </span>
              }
              name={!isCollapsed ? node.item.name : ""}
              path={`/dashboard/lists/${node.item.id}`}
              isCollapsed={isCollapsed}
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
              className="group py-3"
              style={{
                paddingLeft: isCollapsed ? "1.5rem" : `${level * 1}rem`,
                justifyContent: isCollapsed ? "center" : "flex-start",
              }}
            />
          )}
        />
      ) : (
        <p className="text-center text-gray-500">-</p>
      )}
    </ul>
  );
}
