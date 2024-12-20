import { Check } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useUpdateBookmark } from "@hoarder/shared-react/hooks/bookmarks";
import { useToast } from "@/components/ui/use-toast";
import type { ZBookmark } from "@hoarder/shared/types/bookmarks";
import { FavouritedActionIcon, ArchivedActionIcon } from "./icons";

interface BookmarkHoverActionsProps {
  bookmark: ZBookmark;
  isSelected: boolean;
  onSelectClick: (e: React.MouseEvent) => void;
}

export function BookmarkHoverActions({ 
  bookmark, 
  isSelected, 
  onSelectClick 
}: BookmarkHoverActionsProps) {
  const { theme } = useTheme();
  const { toast } = useToast();
  const updateBookmarkMutator = useUpdateBookmark({
    onSuccess: () => {
      toast({
        description: "Bookmark updated successfully",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Something went wrong",
      });
    },
  });

  const getIconColor = () => {
    if (theme === "dark") {
      return isSelected ? "black" : "white";
    }
    return isSelected ? "white" : "black";
  };

  const getIconBackgroundColor = () => {
    if (theme === "dark") {
      return isSelected ? "bg-white" : "bg-white bg-opacity-10";
    }
    return isSelected ? "bg-black" : "bg-white bg-opacity-40";
  };

  return (
    <div className={cn(
      "absolute right-2 top-2 z-50 flex items-center gap-2 group-hover:visible rounded-lg px-2 py-1",
      isSelected ? "visible" : "invisible",
      theme === "dark" ? "bg-black/50 backdrop-blur-sm" : "bg-white/50 backdrop-blur-sm"
    )}>
      <button
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent",
        )}
        onClick={() =>
          updateBookmarkMutator.mutate({
            bookmarkId: bookmark.id,
            favourited: !bookmark.favourited,
          })
        }
      >
        <FavouritedActionIcon
          className="size-4"
          favourited={bookmark.favourited}
        />
      </button>
      <button
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent",
        )}
        onClick={() =>
          updateBookmarkMutator.mutate({
            bookmarkId: bookmark.id,
            archived: !bookmark.archived,
          })
        }
      >
        <ArchivedActionIcon
          className="size-4"
          archived={bookmark.archived}
        />
      </button>
      <button onClick={onSelectClick}>
        <div
          className={cn(
            "flex h-4 w-4 items-center justify-center rounded-full border border-gray-600",
            getIconBackgroundColor(),
          )}
        >
          <Check size={12} color={getIconColor()} />
        </div>
      </button>
    </div>
  );
}
