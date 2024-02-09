"use client";

import { useToast } from "@/components/ui/use-toast";
import APIClient from "@/lib/api";
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
    const [_, error] = await APIClient.deleteBookmark(linkId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "There was a problem with your request.",
      });
    } else {
      toast({
        description: "The bookmark has been deleted!",
      });
    }

    router.refresh();
  };

  const updateBookmark = async (req: ZUpdateBookmarksRequest) => {
    const [_, error] = await APIClient.updateBookmark(linkId, req);

    if (error) {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "There was a problem with your request.",
      });
    } else {
      toast({
        description: "The bookmark has been updated!",
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
          onClick={() => updateBookmark({ favourited: !bookmark.favourited })}
        >
          <Star className="mr-2 size-4" />
          <span>{bookmark.favourited ? "Un-favourite" : "Favourite"}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => updateBookmark({ archived: !bookmark.archived })}
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
