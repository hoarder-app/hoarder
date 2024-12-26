import React from "react";
import { ActionButton, ActionButtonProps } from "@/components/ui/action-button";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/lib/trpc";
import { useUpdateBookmark } from "@hoarder/shared-react/hooks/bookmarks";

interface FavouriteBookmarkButtonProps
  extends Omit<ActionButtonProps, "loading" | "disabled"> {
  bookmarkId: string;
  onDone?: () => void;
}

const FavouriteBookmarkButton = React.forwardRef<
  HTMLButtonElement,
  FavouriteBookmarkButtonProps
>(({ bookmarkId, onDone, ...props }, ref) => {
  const { data } = api.bookmarks.getBookmark.useQuery({ bookmarkId });

  const { mutate: updateBookmark, isPending: isFavouritingBookmark } =
    useUpdateBookmark({
      onSuccess: () => {
        toast({
          description: "Bookmark has been updated!",
        });
        onDone?.();
      },
      onError: (e) => {
        if (e.data?.code == "BAD_REQUEST") {
          toast({
            variant: "destructive",
            description: e.message,
          });
        } else {
          toast({
            variant: "destructive",
            title: "Something went wrong",
          });
        }
      },
    });

  if (!data) {
    return <span />;
  }

  return (
    <ActionButton
      ref={ref}
      loading={isFavouritingBookmark}
      onClick={() =>
        updateBookmark({
          bookmarkId,
          favourited: !data.favourited,
        })
      }
      {...props}
    />
  );
});

FavouriteBookmarkButton.displayName = "FavouriteBookmarkButton";
export default FavouriteBookmarkButton;
