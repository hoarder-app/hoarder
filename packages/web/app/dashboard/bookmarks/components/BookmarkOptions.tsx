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
import { Archive, MoreHorizontal, RotateCw, Star, Trash2 } from "lucide-react";

export default function BookmarkOptions({ bookmark }: { bookmark: ZBookmark }) {
  const { toast } = useToast();
  const router = useRouter();
  const linkId = bookmark.id;

  const onError = () => {
    toast({
      variant: "destructive",
      title: "Something went wrong",
      description: "There was a problem with your request.",
    });
  };
  const onSettled = () => {
    router.refresh();
  };
  const deleteBookmarkMutator = api.bookmarks.deleteBookmark.useMutation({
    onSuccess: () => {
      toast({
        description: "The bookmark has been deleted!",
      });
    },
    onError,
    onSettled,
  });

  const updateBookmarkMutator = api.bookmarks.updateBookmark.useMutation({
    onSuccess: () => {
      toast({
        description: "The bookmark has been updated!",
      });
    },
    onError,
    onSettled,
  });

  const crawlBookmarkMutator = api.bookmarks.recrawlBookmark.useMutation({
    onSuccess: () => {
      toast({
        description: "Re-fetch has been enqueued!",
      });
    },
    onError,
    onSettled,
  });

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
            updateBookmarkMutator.mutate({
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
            updateBookmarkMutator.mutate({
              bookmarkId: linkId,
              archived: !bookmark.archived,
            })
          }
        >
          <Archive className="mr-2 size-4" />
          <span>{bookmark.archived ? "Un-archive" : "Archive"}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            crawlBookmarkMutator.mutate({ bookmarkId: bookmark.id })
          }
        >
          <RotateCw className="mr-2 size-4" />
          <span>Refresh</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive"
          onClick={() =>
            deleteBookmarkMutator.mutate({ bookmarkId: bookmark.id })
          }
        >
          <Trash2 className="mr-2 size-4" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
