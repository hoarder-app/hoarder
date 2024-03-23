"use client";

import { useState } from "react";
import { isBookmarkStillTagging } from "@/lib/bookmarkUtils";
import { api } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import Markdown from "react-markdown";

import type { ZBookmark } from "@hoarder/trpc/types/bookmarks";

import BookmarkActionBar from "./BookmarkActionBar";
import { BookmarkedTextViewer } from "./BookmarkedTextViewer";
import TagList from "./TagList";

export default function TextCard({
  bookmark: initialData,
  className,
}: {
  bookmark: ZBookmark;
  className?: string;
}) {
  const { data: bookmark } = api.bookmarks.getBookmark.useQuery(
    {
      bookmarkId: initialData.id,
    },
    {
      initialData,
      refetchInterval: (query) => {
        const data = query.state.data;
        if (!data) {
          return false;
        }
        if (isBookmarkStillTagging(data)) {
          return 1000;
        }
        return false;
      },
    },
  );
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const bookmarkedText = bookmark.content;
  if (bookmarkedText.type != "text") {
    throw new Error("Unexpected bookmark type");
  }

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
            "flex h-min max-h-96 flex-col gap-y-1 overflow-hidden rounded-lg p-2 shadow-md",
          ),
        )}
      >
        <Markdown className="prose grow overflow-hidden dark:prose-invert">
          {bookmarkedText.text}
        </Markdown>
        <div className="mt-4 flex flex-none flex-wrap gap-1 overflow-hidden">
          <TagList
            bookmark={bookmark}
            loading={isBookmarkStillTagging(bookmark)}
          />
        </div>
        <div className="flex w-full justify-between">
          <div />
          <BookmarkActionBar bookmark={bookmark} />
        </div>
      </div>
    </>
  );
}
