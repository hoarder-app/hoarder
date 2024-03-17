import { Button } from "@/components/ui/button";
import { DialogContent } from "@/components/ui/dialog";
import { Dialog, DialogTrigger } from "@radix-ui/react-dialog";
import { Maximize2, Star } from "lucide-react";

import type { ZBookmark } from "@hoarder/trpc/types/bookmarks";

import BookmarkOptions from "./BookmarkOptions";
import BookmarkPreview from "./BookmarkPreview";

export default function BookmarkActionBar({
  bookmark,
}: {
  bookmark: ZBookmark;
}) {
  return (
    <div className="flex text-gray-500">
      {bookmark.favourited && (
        <Star
          className="m-1 size-8 rounded p-1"
          color="#ebb434"
          fill="#ebb434"
        />
      )}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" className="my-auto block px-2">
            <Maximize2 size="20" />
          </Button>
        </DialogTrigger>
        <DialogContent className="h-[90%] max-w-[90%] overflow-hidden">
          <BookmarkPreview initialData={bookmark} />
        </DialogContent>
      </Dialog>
      <BookmarkOptions bookmark={bookmark} />
    </div>
  );
}
