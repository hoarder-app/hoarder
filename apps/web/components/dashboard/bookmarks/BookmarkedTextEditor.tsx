"use client";

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
import { useTheme } from "next-themes";

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
    bookmark && bookmark.content.type === BookmarkTypes.TEXT
      ? bookmark.content.text
      : "",
  );

  const { resolvedTheme } = useTheme();

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
      <DialogContent
        className={`${
          resolvedTheme === "dark"
            ? "bg-gray-900 text-white opacity-80 backdrop-blur-lg"
            : "bg-white text-gray-900  opacity-80 backdrop-blur-lg"
        } rounded-lg p-6`}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-orange-500">
            {isNewBookmark ? "New Note" : "Edit Note"}
          </DialogTitle>
          <DialogDescription>
            Write your note with markdown support
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          className={`mt-2 h-52 w-full rounded-md p-4 ${
            resolvedTheme === "dark"
              ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400"
              : "border-gray-300 bg-gray-100 text-gray-900 placeholder-gray-600"
          }`}
          placeholder="Type your note here..."
        />
        <DialogFooter className="flex-shrink gap-1 sm:justify-end">
          <DialogClose asChild>
            <Button
              type="button"
              variant="secondary"
              className={`${
                resolvedTheme === "dark"
                  ? "rounded-lg bg-gray-600 text-white hover:bg-gray-700"
                  : "rounded-lg bg-gray-200 text-gray-900 hover:bg-gray-300"
              }`}
            >
              Close
            </Button>
          </DialogClose>
          <ActionButton
            type="button"
            loading={isPending}
            onClick={onSave}
            className={`${
              resolvedTheme === "dark"
                ? "rounded-lg bg-orange-600 text-white hover:bg-orange-700"
                : "rounded-lg bg-orange-500 text-white hover:bg-orange-600"
            }`}
          >
            Save
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
