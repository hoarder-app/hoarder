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
import Link from "next/link";

function isStillTagging(bookmark: ZBookmark) {
  return (
    bookmark.taggingStatus == "pending" &&
    Date.now().valueOf() - bookmark.createdAt.valueOf() < 30 * 1000
  );
}

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
        if (isStillTagging(data)) {
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
        <Markdown className="prose grow overflow-hidden">
          {bookmarkedText.text}
        </Markdown>
        <div className="mt-4 flex flex-none flex-wrap gap-1 overflow-hidden">
          <TagList bookmark={bookmark} loading={isStillTagging(bookmark)} />
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
            <Link
              className="my-auto block px-2"
              href={`/dashboard/preview/${bookmark.id}`}
            >
              <Maximize2 size="20" />
            </Link>
            <BookmarkOptions bookmark={bookmark} />
          </div>
        </div>
      </div>
    </>
  );
}
