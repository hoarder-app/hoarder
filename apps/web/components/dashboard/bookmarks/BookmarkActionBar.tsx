import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Maximize2 } from "lucide-react";

import { useUpdateBookmark } from "@hoarder/shared-react/hooks/bookmarks";
import { ZBookmark } from "@hoarder/shared/types/bookmarks";

import BookmarkOptions from "./BookmarkOptions";
import { FavouritedActionIcon } from "./icons";

export default function BookmarkActionBar({
  bookmark,
}: {
  bookmark: ZBookmark;
}) {
  const onError = () => {
    toast({
      variant: "destructive",
      title: "Something went wrong",
      description: "There was a problem with your request.",
    });
  };

  const updateBookmarkMutator = useUpdateBookmark({
    onSuccess: () => {
      toast({
        description: "The bookmark has been updated!",
      });
    },
    onError,
  });

  return (
    <div className="flex text-gray-500">
      <Button
        variant="ghost"
        size="icon"
        onClick={() =>
          updateBookmarkMutator.mutate({
            bookmarkId: bookmark.id,
            favourited: !bookmark.favourited,
          })
        }
      >
        <FavouritedActionIcon
          className="m-1 size-8 rounded p-1"
          favourited={bookmark.favourited}
        />
      </Button>
      <Link
        href={`/dashboard/preview/${bookmark.id}`}
        className={cn(buttonVariants({ variant: "ghost" }), "px-2")}
      >
        <Maximize2 size={16} />
      </Link>
      <BookmarkOptions bookmark={bookmark} />
    </div>
  );
}
