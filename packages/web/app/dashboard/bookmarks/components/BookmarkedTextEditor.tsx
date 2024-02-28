import { ZBookmark } from "@/lib/types/api/bookmarks";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ActionButton } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";

export function BookmarkedTextEditor({
  bookmark,
  open,
  setOpen,
}: {
  bookmark?: ZBookmark;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const isNewBookmark = bookmark === undefined;
  const [noteText, setNoteText] = useState(
    bookmark && bookmark.content.type == "text" ? bookmark.content.text : "",
  );

  const invalidateAllBookmarksCache =
    api.useUtils().bookmarks.getBookmarks.invalidate;
  const invalidateOneBookmarksCache =
    api.useUtils().bookmarks.getBookmark.invalidate;

  const { mutate: createBookmarkMutator, isPending: isCreationPending } =
    api.bookmarks.createBookmark.useMutation({
      onSuccess: () => {
        invalidateAllBookmarksCache();
        toast({
          description: "Note created!",
        });
        setOpen(false);
        setNoteText("");
      },
      onError: () => {
        toast({ description: "Something went wrong", variant: "destructive" });
      },
    });
  const { mutate: updateBookmarkMutator, isPending: isUpdatePending } =
    api.bookmarks.updateBookmarkText.useMutation({
      onSuccess: () => {
        invalidateOneBookmarksCache({
          bookmarkId: bookmark!.id,
        });
        toast({
          description: "Note updated!",
        });
        setOpen(false);
        setNoteText("");
      },
      onError: () => {
        toast({ description: "Something went wrong", variant: "destructive" });
      },
    });
  const isPending = isCreationPending || isUpdatePending;

  const onSave = () => {
    if (isNewBookmark) {
      createBookmarkMutator({
        type: "text",
        text: noteText,
      });
    } else {
      updateBookmarkMutator({
        bookmarkId: bookmark.id,
        text: noteText,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="pb-4">
            {isNewBookmark ? "New Note" : "Edit Note"}
          </DialogTitle>
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            className="h-52 grow"
          />
        </DialogHeader>
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
