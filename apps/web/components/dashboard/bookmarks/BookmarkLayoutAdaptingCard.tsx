import type { BookmarksLayoutTypes } from "@/lib/userLocalSettings/types";
import React from "react";
import Link from "next/link";
import {
  bookmarkLayoutSwitch,
  useBookmarkLayout,
} from "@/lib/userLocalSettings/bookmarksLayout";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";

import type { ZBookmark } from "@hoarder/shared/types/bookmarks";
import { isBookmarkStillTagging } from "@hoarder/shared-react/utils/bookmarkUtils";

import BookmarkActionBar from "./BookmarkActionBar";
import TagList from "./TagList";

interface Props {
  bookmark: ZBookmark;
  image: (layout: BookmarksLayoutTypes, className: string) => React.ReactNode;
  title?: React.ReactNode;
  content?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  fitHeight?: boolean;
  wrapTags: boolean;
}

function BottomRow({
  footer,
  bookmark,
}: {
  footer?: React.ReactNode;
  bookmark: ZBookmark;
}) {
  return (
    <div className="justify flex w-full shrink-0 justify-between text-gray-500">
      <div className="flex items-center gap-2 overflow-hidden text-nowrap">
        {footer && <>{footer}•</>}
        <Link href={`/dashboard/preview/${bookmark.id}`}>
          {dayjs(bookmark.createdAt).format("MMM DD")}
        </Link>
      </div>
      <BookmarkActionBar bookmark={bookmark} />
    </div>
  );
}

function ListView({
  bookmark,
  image,
  title,
  content,
  footer,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex max-h-96 gap-4 overflow-hidden rounded-lg p-2 shadow-md",
        className,
      )}
    >
      <div className="flex size-32 items-center justify-center overflow-hidden">
        {image("list", "object-cover rounded-lg size-32")}
      </div>
      <div className="flex h-full flex-1 flex-col justify-between gap-2 overflow-hidden">
        <div className="flex flex-col gap-2 overflow-hidden">
          {title && (
            <div className="line-clamp-2 flex-none shrink-0 overflow-hidden text-ellipsis break-words text-lg">
              {title}
            </div>
          )}
          {content && <div className="shrink-1 overflow-hidden">{content}</div>}
          <div className="flex shrink-0 flex-wrap gap-1 overflow-hidden">
            <TagList
              bookmark={bookmark}
              loading={isBookmarkStillTagging(bookmark)}
            />
          </div>
        </div>
        <BottomRow footer={footer} bookmark={bookmark} />
      </div>
    </div>
  );
}

function GridView({
  bookmark,
  image,
  title,
  content,
  footer,
  className,
  wrapTags,
  layout,
  fitHeight = false,
}: Props & { layout: BookmarksLayoutTypes }) {
  const img = image("grid", "h-56 min-h-56 w-full object-cover rounded-t-lg");

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-lg shadow-md",
        className,
        fitHeight && layout != "grid" ? "max-h-96" : "h-96",
      )}
    >
      {img && <div className="h-56 w-full shrink-0 overflow-hidden">{img}</div>}
      <div className="flex h-full flex-col justify-between gap-2 overflow-hidden p-2">
        <div className="grow-1 flex flex-col gap-2 overflow-hidden">
          {title && (
            <div className="line-clamp-2 flex-none shrink-0 overflow-hidden text-ellipsis break-words text-lg">
              {title}
            </div>
          )}
          {content && <div className="shrink-1 overflow-hidden">{content}</div>}
          <div className="flex shrink-0 flex-wrap gap-1 overflow-hidden">
            <TagList
              className={wrapTags ? undefined : "h-full"}
              bookmark={bookmark}
              loading={isBookmarkStillTagging(bookmark)}
            />
          </div>
        </div>
        <BottomRow footer={footer} bookmark={bookmark} />
      </div>
    </div>
  );
}

export function BookmarkLayoutAdaptingCard(props: Props) {
  const layout = useBookmarkLayout();

  return bookmarkLayoutSwitch(layout, {
    masonry: <GridView layout={layout} {...props} />,
    grid: <GridView layout={layout} {...props} />,
    list: <ListView {...props} />,
  });
}
