"use client";

import { MarkdownComponent } from "@/components/ui/markdown-component";
import { bookmarkLayoutSwitch } from "@/lib/userLocalSettings/bookmarksLayout";
import { cn } from "@/lib/utils";

import type { ZBookmarkTypeText } from "@hoarder/shared/types/bookmarks";
import { getSourceUrl } from "@hoarder/shared-react/utils/bookmarkUtils";

import { BookmarkLayoutAdaptingCard } from "./BookmarkLayoutAdaptingCard";
import FooterLinkURL from "./FooterLinkURL";

export default function TextCard({
  bookmark,
  className,
}: {
  bookmark: ZBookmarkTypeText;
  className?: string;
}) {
  const bookmarkedText = bookmark.content;

  return (
    <>
      <BookmarkLayoutAdaptingCard
        title={bookmark.title}
        content={<MarkdownComponent>{bookmarkedText.text}</MarkdownComponent>}
        footer={
          getSourceUrl(bookmark) && (
            <FooterLinkURL url={getSourceUrl(bookmark)} />
          )
        }
        wrapTags={true}
        bookmark={bookmark}
        className={className}
        fitHeight={true}
        image={(layout, className) =>
          bookmarkLayoutSwitch(layout, {
            grid: null,
            masonry: null,
            compact: null,
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
