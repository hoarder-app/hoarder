"use client";

import { useMemo } from "react";
import { ActionButton } from "@/components/ui/action-button";
import tailwindConfig from "@/tailwind.config";
import { Slot } from "@radix-ui/react-slot";
import Masonry from "react-masonry-css";
import resolveConfig from "tailwindcss/resolveConfig";

import type { ZBookmark } from "@hoarder/trpc/types/bookmarks";

import AssetCard from "./AssetCard";
import EditorCard from "./EditorCard";
import LinkCard from "./LinkCard";
import TextCard from "./TextCard";

function BookmarkCard({ children }: { children: React.ReactNode }) {
  return (
    <Slot className="mb-4 border border-border bg-card duration-300 ease-in hover:shadow-lg hover:transition-all">
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
    case "asset":
      comp = <AssetCard bookmark={bookmark} />;
      break;
  }
  return <BookmarkCard key={bookmark.id}>{comp}</BookmarkCard>;
}

export default function BookmarksGrid({
  bookmarks,
  hasNextPage = false,
  fetchNextPage = () => ({}),
  isFetchingNextPage = false,
  showEditorCard = false,
}: {
  bookmarks: ZBookmark[];
  showEditorCard?: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
}) {
  const breakpointConfig = useMemo(() => getBreakpointConfig(), []);
  if (bookmarks.length == 0 && !showEditorCard) {
    return <p>No bookmarks</p>;
  }
  return (
    <>
      <Masonry className="flex gap-4" breakpointCols={breakpointConfig}>
        {showEditorCard && (
          <BookmarkCard>
            <EditorCard />
          </BookmarkCard>
        )}
        {bookmarks.map((b) => renderBookmark(b))}
      </Masonry>
      {hasNextPage && (
        <ActionButton
          ignoreDemoMode={true}
          loading={isFetchingNextPage}
          onClick={() => fetchNextPage()}
          className="mx-auto w-min"
          variant="ghost"
        >
          Load More
        </ActionButton>
      )}
    </>
  );
}
