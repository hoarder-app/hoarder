"use client";

import { ZBookmark } from "@/lib/types/api/bookmarks";
import BookmarkOptions from "./BookmarkOptions";
import { api } from "@/lib/trpc";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import TagList from "./TagList";

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
  const bookmarkedText = bookmark.content;
  if (bookmarkedText.type != "text") {
    throw new Error("Unexpected bookmark type");
  }

  const numWords = bookmarkedText.text.split(" ").length;

  return (
    <div
      className={cn(
        className,
        cn(
          "flex flex-col gap-y-1 overflow-hidden rounded-lg p-2 shadow-md",
          numWords > 12 ? "row-span-2 h-96" : "row-span-1 h-40",
        ),
      )}
    >
      <p className="grow overflow-hidden text-ellipsis">
        {bookmarkedText.text}
      </p>
      <div className="flex flex-none flex-wrap gap-1 overflow-hidden">
        <TagList bookmark={bookmark} />
      </div>
      <div className="flex w-full justify-between">
        <div>
          {bookmark.favourited && (
            <Star
              className="my-1 size-8 rounded p-1"
              color="#ebb434"
              fill="#ebb434"
            />
          )}
        </div>
        <BookmarkOptions bookmark={bookmark} />
      </div>
    </div>
  );
}
