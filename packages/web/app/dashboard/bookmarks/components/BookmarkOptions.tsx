"use client";

import { useToast } from "@/components/ui/use-toast";
import { api } from "@/lib/trpc";
import { ZBookmark, ZUpdateBookmarksRequest } from "@/lib/types/api/bookmarks";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Archive, MoreHorizontal, Star, Trash2 } from "lucide-react";

export default function BookmarkOptions({ bookmark }: { bookmark: ZBookmark }) {
  const { toast } = useToast();
  const router = useRouter();
  const linkId = bookmark.id;

  const unbookmarkLink = async () => {
    try {
      await api.bookmarks.deleteBookmark.mutate({
        bookmarkId: linkId,
      });

      toast({
        description: "The bookmark has been deleted!",
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "There was a problem with your request.",
      });
    }

    router.refresh();
  };

  const updateBookmark = async (req: ZUpdateBookmarksRequest) => {
    try {
      await api.bookmarks.updateBookmark.mutate(req);
      toast({
        description: "The bookmark has been updated!",
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "There was a problem with your request.",
      });
    }

    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-fit">
        <DropdownMenuItem
          onClick={() =>
            updateBookmark({
              bookmarkId: linkId,
              favourited: !bookmark.favourited,
            })
          }
        >
          <Star className="mr-2 size-4" />
          <span>{bookmark.favourited ? "Un-favourite" : "Favourite"}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            updateBookmark({ bookmarkId: linkId, archived: !bookmark.archived })
          }
        >
          <Archive className="mr-2 size-4" />
          <span>{bookmark.archived ? "Un-archive" : "Archive"}</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="text-destructive" onClick={unbookmarkLink}>
          <Trash2 className="mr-2 size-4" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
