import BookmarkPreview from "@/components/dashboard/preview/BookmarkPreview";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Maximize2 } from "lucide-react";

import type { ZBookmark } from "@hoarder/trpc/types/bookmarks";

import BookmarkOptions from "./BookmarkOptions";
import { FavouritedActionIcon } from "./icons";

export default function BookmarkActionBar({
  bookmark,
}: {
  bookmark: ZBookmark;
}) {
  return (
    <div className="flex text-gray-500">
      {bookmark.favourited && (
        <FavouritedActionIcon className="m-1 size-8 rounded p-1" favourited />
      )}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" className="my-auto block px-2">
            <Maximize2 size="20" />
          </Button>
        </DialogTrigger>
        <DialogContent
          className="h-[90%] max-w-[90%] overflow-hidden p-0"
          hideCloseBtn={true}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <BookmarkPreview initialData={bookmark} />
        </DialogContent>
      </Dialog>
      <BookmarkOptions bookmark={bookmark} />
    </div>
  );
}
