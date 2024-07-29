"use client";

import Link from "next/link";
import { EditListModal } from "@/components/dashboard/lists/EditListModal";
import { Button } from "@/components/ui/button";
import { CollapsibleTriggerChevron } from "@/components/ui/collapsible";
import { Archive, MoreHorizontal, Plus, Star } from "lucide-react";
import { useTheme } from "next-themes";

import type { ZBookmarkList } from "@hoarder/shared/types/lists";

import { CollapsibleBookmarkLists } from "./CollapsibleBookmarkLists";
import { ListOptions } from "./ListOptions";

function ListItem({
  name,
  icon,
  path,
  style,
  list,
  open,
  collapsible,
}: {
  name: string;
  icon: React.ReactNode;
  path: string;
  style?: React.CSSProperties;
  list?: ZBookmarkList;
  open?: boolean;
  collapsible: boolean;
}) {
  const { theme } = useTheme();

  return (
    <li
      className={`my-2 flex items-center justify-between rounded-md border p-2 hover:bg-opacity-50 ${
        theme === "dark"
          ? "border-gray-700 bg-gray-800 text-white"
          : "border-gray-300 bg-white text-gray-900"
      }`}
      style={style}
    >
      <span className="flex flex-1 items-center gap-1">
        {collapsible && (
          <CollapsibleTriggerChevron className="size-5" open={open ?? false} />
        )}
        <Link href={path} className="flex flex-1 gap-1">
          <p className="text-nowrap text-lg">
            {icon} {name}
          </p>
        </Link>
      </span>
      {list && (
        <ListOptions list={list}>
          <Button
            className="flex h-full items-center justify-end"
            variant="ghost"
          >
            <MoreHorizontal />
          </Button>
        </ListOptions>
      )}
    </li>
  );
}

export default function AllListsView({
  initialData = [],
}: {
  initialData: ZBookmarkList[];
}) {
  const { theme } = useTheme();

  return (
    <div className="w-100 container space-y-4 rounded-md border bg-background bg-opacity-60 p-4">
      <div className="flex justify-end">
        <EditListModal>
          <Button className="flex h-full items-center rounded-lg font-semibold">
            <Plus className="text-orange-500" />
            <span className="ml-2">New List</span>
          </Button>
        </EditListModal>
      </div>

      <ul
        className={`rounded-md bg-opacity-60 p-4 backdrop-blur-lg backdrop-filter ${
          theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-900"
        }`}
      >
        <ListItem
          collapsible={false}
          name="Favourites"
          icon={<Star className="text-lg" />}
          path={`/dashboard/favourites`}
        />
        <ListItem
          collapsible={false}
          name="Archive"
          icon={<Archive className="text-lg" />}
          path={`/dashboard/archive`}
        />
        {initialData.length > 0 ? (
          <CollapsibleBookmarkLists
            initialData={initialData}
            render={({ item, level, open }) => (
              <ListItem
                key={item.item.id}
                name={item.item.name}
                icon={<span className="text-lg">{item.item.icon}</span>}
                list={item.item}
                path={`/dashboard/lists/${item.item.id}`}
                collapsible={item.children.length > 0}
                open={open}
                style={{ marginLeft: `${level * 1}rem` }}
              />
            )}
          />
        ) : (
          <p className="text-center text-gray-500">No lists available</p>
        )}
      </ul>
    </div>
  );
}
