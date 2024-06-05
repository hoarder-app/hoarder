"use client";

import { useState } from "react";
import { MarkdownComponent } from "@/components/ui/markdown-component";
import { api } from "@/lib/trpc";
import { bookmarkLayoutSwitch } from "@/lib/userLocalSettings/bookmarksLayout";
import { cn } from "@/lib/utils";

import type { ZBookmark } from "@hoarder/shared/types/bookmarks";
import { isBookmarkStillTagging } from "@hoarder/shared-react/utils/bookmarkUtils";

import { BookmarkedTextViewer } from "./BookmarkedTextViewer";
import { BookmarkLayoutAdaptingCard } from "./BookmarkLayoutAdaptingCard";

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
      {/* TODO: Where is that used? Is it simply unused?*/}
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
