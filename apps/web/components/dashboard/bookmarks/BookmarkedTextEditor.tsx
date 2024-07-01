import { useState } from "react";
import { ActionButton } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/lib/trpc";

import { BookmarkTypes, ZBookmark } from "@hoarder/shared/types/bookmarks";

export function BookmarkedTextEditor({
  bookmark,
  open,
  setOpen,
}: {
  bookmark: ZBookmark;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const isNewBookmark = bookmark === undefined;
  const [noteText, setNoteText] = useState(
    bookmark && bookmark.content.type == BookmarkTypes.TEXT
      ? bookmark.content.text
      : "",
  );

  const invalidateOneBookmarksCache =
    api.useUtils().bookmarks.getBookmark.invalidate;

  const { mutate: updateBookmarkMutator, isPending } =
    api.bookmarks.updateBookmarkText.useMutation({
      onSuccess: () => {
        invalidateOneBookmarksCache({
          bookmarkId: bookmark.id,
        });
        toast({
          description: "Note updated!",
        });
        setOpen(false);
      },
      onError: () => {
        toast({ description: "Something went wrong", variant: "destructive" });
      },
    });

  const onSave = () => {
    updateBookmarkMutator({
      bookmarkId: bookmark.id,
      text: noteText,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isNewBookmark ? "New Note" : "Edit Note"}</DialogTitle>
          <DialogDescription>
            Write your note with markdown support
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          className="h-52 grow"
        />
        <DialogFooter className="flex-shrink gap-1 sm:justify-end">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
          <ActionButton type="button" loading={isPending} onClick={onSave}>
            Save
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
