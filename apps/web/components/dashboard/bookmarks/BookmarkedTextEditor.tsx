import { BookmarkMarkdownComponent } from "@/components/dashboard/bookmarks/BookmarkMarkdownComponent";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { ZBookmark, ZBookmarkTypeText } from "@hoarder/shared/types/bookmarks";

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[80%]">
        <DialogHeader className="flex">
          <DialogTitle className="w-fit">
            {isNewBookmark ? "New Note" : "Edit Note"}
          </DialogTitle>
        </DialogHeader>
        <div className="h-[80vh]">
          <BookmarkMarkdownComponent readOnly={false}>
            {bookmark as ZBookmarkTypeText}
          </BookmarkMarkdownComponent>
        </div>
      </DialogContent>
    </Dialog>
  );
}
