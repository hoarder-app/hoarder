import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/action-button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/components/ui/use-toast";
import { Trash2 } from "lucide-react";

import type { ZBookmark } from "@hoarder/shared/types/bookmarks";
import {
  useDeleteBookmark,
  useUpdateBookmark,
} from "@hoarder/shared-react/hooks/bookmarks";

import { ArchivedActionIcon, FavouritedActionIcon } from "../bookmarks/icons";

export default function ActionBar({ bookmark }: { bookmark: ZBookmark }) {
  const router = useRouter();
  const onError = () => {
    toast({
      variant: "destructive",
      title: "Something went wrong",
      description: "There was a problem with your request.",
    });
  };
  const { mutate: favBookmark, isPending: pendingFav } = useUpdateBookmark({
    onSuccess: () => {
      toast({
        description: "The bookmark has been updated!",
      });
    },
    onError,
  });
  const { mutate: archiveBookmark, isPending: pendingArchive } =
    useUpdateBookmark({
      onSuccess: (resp) => {
        toast({
          description: `The bookmark has been ${resp.archived ? "Archived" : "Un-archived"}!`,
        });
      },
      onError,
    });
  const { mutate: deleteBookmark, isPending: pendingDeletion } =
    useDeleteBookmark({
      onSuccess: () => {
        toast({
          description: "The bookmark has been deleted!",
        });
        router.back();
      },
      onError,
    });

  return (
    <div className="flex items-center justify-center gap-3">
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <ActionButton
            variant="none"
            className="size-14 rounded-full bg-background"
            loading={pendingFav}
            onClick={() => {
              favBookmark({
                bookmarkId: bookmark.id,
                favourited: !bookmark.favourited,
              });
            }}
          >
            <FavouritedActionIcon favourited={bookmark.favourited} />
          </ActionButton>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {bookmark.favourited ? "Un-favourite" : "Favourite"}
        </TooltipContent>
      </Tooltip>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <ActionButton
            variant="none"
            loading={pendingArchive}
            className="size-14 rounded-full bg-background"
            onClick={() => {
              archiveBookmark({
                bookmarkId: bookmark.id,
                archived: !bookmark.archived,
              });
            }}
          >
            <ArchivedActionIcon archived={bookmark.archived} />
          </ActionButton>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {bookmark.archived ? "Un-archive" : "Archive"}
        </TooltipContent>
      </Tooltip>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <ActionButton
            loading={pendingDeletion}
            className="size-14 rounded-full bg-background"
            variant="none"
            onClick={() => {
              deleteBookmark({ bookmarkId: bookmark.id });
            }}
          >
            <Trash2 />
          </ActionButton>
        </TooltipTrigger>
        <TooltipContent side="bottom">Delete</TooltipContent>
      </Tooltip>
    </div>
  );
}
