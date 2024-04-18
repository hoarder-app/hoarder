import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { ZBookmark } from "@hoarder/shared/types/bookmarks";

import { TagsEditor } from "./TagsEditor";

export default function TagModal({
  bookmark,
  open,
  setOpen,
}: {
  bookmark: ZBookmark;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Tags</DialogTitle>
        </DialogHeader>
        <TagsEditor bookmark={bookmark} />
        <DialogFooter className="sm:justify-end">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function useTagModel(bookmark: ZBookmark) {
  const [open, setOpen] = useState(false);

  return {
    open,
    setOpen,
    content: (
      <TagModal
        key={bookmark.id}
        bookmark={bookmark}
        open={open}
        setOpen={setOpen}
      />
    ),
  };
}
