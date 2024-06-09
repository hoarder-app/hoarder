"use client";

import { useState } from "react";
import { MarkdownComponent } from "@/components/ui/markdown-component";
import { bookmarkLayoutSwitch } from "@/lib/userLocalSettings/bookmarksLayout";
import { cn } from "@/lib/utils";

import type { ZBookmarkTypeText } from "@hoarder/shared/types/bookmarks";

import { BookmarkedTextViewer } from "./BookmarkedTextViewer";
import { BookmarkLayoutAdaptingCard } from "./BookmarkLayoutAdaptingCard";

export default function TextCard({
  bookmark,
  className,
}: {
  bookmark: ZBookmarkTypeText;
  className?: string;
}) {
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const bookmarkedText = bookmark.content;

  return (
    <>
      <BookmarkedTextViewer
        content={bookmarkedText.text}
        open={previewModalOpen}
        setOpen={setPreviewModalOpen}
      />
      <BookmarkLayoutAdaptingCard
        title={bookmark.title}
        content={<MarkdownComponent>{bookmarkedText.text}</MarkdownComponent>}
        footer={null}
        wrapTags={true}
        bookmark={bookmark}
        className={className}
        fitHeight={true}
        image={(layout, className) =>
          bookmarkLayoutSwitch(layout, {
            grid: null,
            masonry: null,
            list: (
              <div
                className={cn(
                  "flex size-full items-center justify-center bg-accent text-center",
                  className,
                )}
              >
                Note
              </div>
            ),
          })
        }
      />
    </>
  );
}
