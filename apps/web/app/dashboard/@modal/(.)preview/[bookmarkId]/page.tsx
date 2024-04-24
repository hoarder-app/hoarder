"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BookmarkPreview from "@/components/dashboard/preview/BookmarkPreview";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function BookmarkPreviewPage({
  params,
}: {
  params: { bookmarkId: string };
}) {
  const router = useRouter();

  const [open, setOpen] = useState(true);

  const setOpenWithRouter = (value: boolean) => {
    setOpen(value);
    if (!value) {
      router.back();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpenWithRouter}>
      <DialogContent
        className="h-[90%] max-w-[90%] overflow-hidden p-0"
        hideCloseBtn={true}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <BookmarkPreview bookmarkId={params.bookmarkId} />
      </DialogContent>
    </Dialog>
  );
}
