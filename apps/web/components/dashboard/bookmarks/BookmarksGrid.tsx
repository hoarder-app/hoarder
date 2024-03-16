"use client";

import { useMemo } from "react";
import { api } from "@/lib/trpc";
import tailwindConfig from "@/tailwind.config";
import { Slot } from "@radix-ui/react-slot";
import Masonry from "react-masonry-css";
import resolveConfig from "tailwindcss/resolveConfig";

import type {
  ZBookmark,
  ZGetBookmarksRequest,
} from "@hoarder/trpc/types/bookmarks";

import EditorCard from "./EditorCard";
import LinkCard from "./LinkCard";
import TextCard from "./TextCard";

function BookmarkCard({ children }: { children: React.ReactNode }) {
  return (
    <Slot className="border-grey-100 mb-4 border bg-gray-50 duration-300 ease-in hover:shadow-lg hover:transition-all">
      {children}
    </Slot>
  );
}

function getBreakpointConfig() {
  const fullConfig = resolveConfig(tailwindConfig);

  const breakpointColumnsObj: { [key: number]: number; default: number } = {
    default: 3,
  };
  breakpointColumnsObj[parseInt(fullConfig.theme.screens.lg)] = 2;
  breakpointColumnsObj[parseInt(fullConfig.theme.screens.md)] = 1;
  breakpointColumnsObj[parseInt(fullConfig.theme.screens.sm)] = 1;
  return breakpointColumnsObj;
}

function renderBookmark(bookmark: ZBookmark) {
  let comp;
  switch (bookmark.content.type) {
    case "link":
      comp = <LinkCard bookmark={bookmark} />;
      break;
    case "text":
      comp = <TextCard bookmark={bookmark} />;
      break;
  }
  return <BookmarkCard key={bookmark.id}>{comp}</BookmarkCard>;
}

export default function BookmarksGrid({
  query,
  bookmarks: initialBookmarks,
  showEditorCard = false,
}: {
  query: ZGetBookmarksRequest;
  bookmarks: ZBookmark[];
  showEditorCard?: boolean;
}) {
  const { data } = api.bookmarks.getBookmarks.useQuery(query, {
    initialData: { bookmarks: initialBookmarks },
  });
  const breakpointConfig = useMemo(() => getBreakpointConfig(), []);
  if (data.bookmarks.length == 0) {
    return <p>No bookmarks</p>;
  }
  return (
    <Masonry className="flex gap-4" breakpointCols={breakpointConfig}>
      {showEditorCard && (
        <BookmarkCard>
          <EditorCard />
        </BookmarkCard>
      )}
      {data.bookmarks.map((b) => renderBookmark(b))}
    </Masonry>
  );
}
