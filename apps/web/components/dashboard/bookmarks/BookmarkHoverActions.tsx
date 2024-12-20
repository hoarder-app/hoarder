import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { useTheme } from "next-themes";

import type { ZBookmark } from "@hoarder/shared/types/bookmarks";

import ArchiveBookmarkButton from "./action-buttons/ArchiveBookmarkButton";
import FavouriteBookmarkButton from "./action-buttons/FavouriteBookmarkButton";
import { ArchivedActionIcon, FavouritedActionIcon } from "./icons";

interface BookmarkHoverActionsProps {
  bookmark: ZBookmark;
  isSelected: boolean;
  onSelectClick: (e: React.MouseEvent) => void;
}

function SelectCheckbox({ isSelected }: { isSelected: boolean }) {
  return (
    <div className="z-50 opacity-100">
      <div
        className={cn(
          "flex size-4 items-center justify-center rounded-full border border-foreground",
          isSelected ? "bg-foreground" : undefined,
        )}
      >
        <Check size={12} className={isSelected ? "text-background" : undefined} />
      </div>
    </div>
  );
}

export function BookmarkHoverActions({
  bookmark,
  isSelected,
  onSelectClick,
}: BookmarkHoverActionsProps) {
  const { theme } = useTheme();

  return (
    <div
      className={cn(
        "absolute right-2 top-2 z-50 flex items-center gap-2 rounded-lg px-2 py-1 group-hover:visible",
        isSelected ? "visible" : "invisible",
        theme === "dark"
          ? "bg-black/50 backdrop-blur-sm"
          : "bg-white/50 backdrop-blur-sm",
      )}
    >
      <FavouriteBookmarkButton
        variant="ghost"
        bookmarkId={bookmark.id}
        className="h-8 w-8 p-0"
      >
        <FavouritedActionIcon
          className="size-4"
          favourited={bookmark.favourited}
        />
      </FavouriteBookmarkButton>
      <ArchiveBookmarkButton
        variant="ghost"
        bookmarkId={bookmark.id}
        className="h-8 w-8 p-0"
      >
        <ArchivedActionIcon className="size-4" archived={bookmark.archived} />
      </ArchiveBookmarkButton>
      <button
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent",
          isSelected && "bg-accent",
        )}
        onClick={onSelectClick}
      >
        <SelectCheckbox isSelected={isSelected} />
      </button>
    </div>
  );
}
