"use client";

import { ZBookmark } from "@/lib/types/api/bookmarks";
import BookmarkOptions from "./BookmarkOptions";
import { api } from "@/lib/trpc";
import { Maximize2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import TagList from "./TagList";
import Markdown from "react-markdown";
import { useState } from "react";
import { BookmarkedTextViewer } from "./BookmarkedTextViewer";
import { Button } from "@/components/ui/button";

export default function TextCard({
  bookmark: initialData,
  className,
}: {
  bookmark: ZBookmark;
  className: string;
}) {
  const { data: bookmark } = api.bookmarks.getBookmark.useQuery(
    {
      bookmarkId: initialData.id,
    },
    {
      initialData,
    },
  );
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const bookmarkedText = bookmark.content;
  if (bookmarkedText.type != "text") {
    throw new Error("Unexpected bookmark type");
  }

  const numWords = bookmarkedText.text.split(" ").length;

  return (
    <>
      <BookmarkedTextViewer
        content={bookmarkedText.text}
        open={previewModalOpen}
        setOpen={setPreviewModalOpen}
      />
      <div
        className={cn(
          className,
          cn(
            "flex flex-col gap-y-1 overflow-hidden rounded-lg p-2 shadow-md",
            numWords > 12 ? "row-span-2 h-96" : "row-span-1 h-40",
          ),
        )}
      >
        <Markdown className="prose grow overflow-hidden">
          {bookmarkedText.text}
        </Markdown>
        <div className="flex flex-none flex-wrap gap-1 overflow-hidden">
          <TagList bookmark={bookmark} />
        </div>
        <div className="flex w-full justify-between">
          <div />
          <div className="flex gap-0 text-gray-500">
            <div>
              {bookmark.favourited && (
                <Star
                  className="my-1 size-8 rounded p-1"
                  color="#ebb434"
                  fill="#ebb434"
                />
              )}
            </div>
            <Button
              className="px-2"
              variant="ghost"
              onClick={() => setPreviewModalOpen(true)}
            >
              <Maximize2 size="20" />
            </Button>
            <BookmarkOptions bookmark={bookmark} />
          </div>
        </div>
      </div>
    </>
  );
}
