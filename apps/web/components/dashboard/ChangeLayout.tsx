"use client";

import React from "react";
import { ButtonWithTooltip } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/lib/i18n/client";
import { useBookmarkLayout } from "@/lib/userLocalSettings/bookmarksLayout";
import { updateBookmarksLayout } from "@/lib/userLocalSettings/userLocalSettings";
import {
  Check,
  LayoutDashboard,
  LayoutGrid,
  LayoutList,
  List,
  LucideIcon,
} from "lucide-react";

type LayoutType = "masonry" | "grid" | "list" | "compact";

const iconMap: Record<LayoutType, LucideIcon> = {
  masonry: LayoutDashboard,
  grid: LayoutGrid,
  list: LayoutList,
  compact: List,
};

export default function ChangeLayout() {
  const { t } = useTranslation();
  const layout = useBookmarkLayout();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ButtonWithTooltip
          tooltip={t("actions.change_layout")}
          delayDuration={100}
          variant="ghost"
        >
          {React.createElement(iconMap[layout], { size: 18 })}
        </ButtonWithTooltip>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-fit">
        {(Object.keys(iconMap) as LayoutType[]).map((key) => (
          <DropdownMenuItem
            key={key}
            className="cursor-pointer justify-between"
            onClick={async () => await updateBookmarksLayout(key as LayoutType)}
          >
            <div className="flex items-center gap-2">
              {React.createElement(iconMap[key as LayoutType], { size: 18 })}
              <span>{t(`layouts.${key}`)}</span>
            </div>
            {layout == key && <Check className="ml-2 size-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
