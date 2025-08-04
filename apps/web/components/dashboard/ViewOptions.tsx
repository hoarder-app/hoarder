"use client";

import React from "react";
import { ButtonWithTooltip } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import {
  useBookmarkLayout,
  useGridColumns,
} from "@/lib/userLocalSettings/bookmarksLayout";
import {
  updateBookmarksLayout,
  updateGridColumns,
} from "@/lib/userLocalSettings/userLocalSettings";
import {
  Check,
  LayoutDashboard,
  LayoutGrid,
  LayoutList,
  List,
  LucideIcon,
  Settings,
} from "lucide-react";

type LayoutType = "masonry" | "grid" | "list" | "compact";

const iconMap: Record<LayoutType, LucideIcon> = {
  masonry: LayoutDashboard,
  grid: LayoutGrid,
  list: LayoutList,
  compact: List,
};

const layoutNames: Record<LayoutType, string> = {
  masonry: "Masonry",
  grid: "Grid",
  list: "List",
  compact: "Compact",
};

export default function ViewOptions() {
  const layout = useBookmarkLayout();
  const gridColumns = useGridColumns();
  const [tempColumns, setTempColumns] = React.useState(gridColumns);

  const showColumnSlider = layout === "grid" || layout === "masonry";

  // Update temp value when actual value changes
  React.useEffect(() => {
    setTempColumns(gridColumns);
  }, [gridColumns]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ButtonWithTooltip
          tooltip="View Options"
          delayDuration={100}
          variant="ghost"
        >
          <Settings size={18} />
        </ButtonWithTooltip>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <div className="px-2 py-1.5 text-sm font-semibold">Layout</div>
        {(Object.keys(iconMap) as LayoutType[]).map((key) => (
          <DropdownMenuItem
            key={key}
            className="cursor-pointer justify-between"
            onClick={async () => await updateBookmarksLayout(key as LayoutType)}
          >
            <div className="flex items-center gap-2">
              {React.createElement(iconMap[key as LayoutType], { size: 18 })}
              <span>{layoutNames[key]}</span>
            </div>
            {layout === key && <Check className="ml-2 size-4" />}
          </DropdownMenuItem>
        ))}

        {showColumnSlider && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold">Columns</span>
                <span className="text-sm text-muted-foreground">
                  {tempColumns}
                </span>
              </div>
              <Slider
                value={[tempColumns]}
                onValueChange={([value]) => setTempColumns(value)}
                onValueCommit={([value]) => updateGridColumns(value)}
                min={1}
                max={6}
                step={1}
                className="w-full"
              />
              <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>1</span>
                <span>6</span>
              </div>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
