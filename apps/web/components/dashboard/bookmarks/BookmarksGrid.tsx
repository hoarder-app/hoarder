import { useEffect, useMemo, useState } from "react";
import { ActionButton } from "@/components/ui/action-button";
import {
  bookmarkLayoutSwitch,
  useBookmarkLayout,
} from "@/lib/userLocalSettings/bookmarksLayout";
import tailwindConfig from "@/tailwind.config";
import { Slot } from "@radix-ui/react-slot";
import { useTheme } from "next-themes";
import Masonry from "react-masonry-css";
import resolveConfig from "tailwindcss/resolveConfig";

import type { ZBookmark } from "@hoarder/shared/types/bookmarks";

import BookmarkCard from "./BookmarkCard";
import EditorCard from "./EditorCard";

function StyledBookmarkCard({ children }: { children: React.ReactNode }) {
  return (
    <Slot className="mb-4 border border-border bg-card bg-opacity-50 duration-300 ease-in hover:shadow-lg hover:transition-all">
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
  const layout = useBookmarkLayout();
  const breakpointConfig = useMemo(() => getBreakpointConfig(), []);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Mark the component as mounted to avoid hydration mismatch
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render a fallback UI to avoid hydration mismatch
    return <div />;
  }

  if (bookmarks.length === 0 && !showEditorCard) {
    return <p>No bookmarks</p>;
  }

  const children = [
    showEditorCard && (
      <StyledBookmarkCard key={"editor"}>
        <EditorCard />
      </StyledBookmarkCard>
    ),
    ...bookmarks.map((b) => (
      <StyledBookmarkCard key={b.id}>
        <BookmarkCard bookmark={b} />
      </StyledBookmarkCard>
    )),
  ];

  return (
    <div
      className={`rounded-lg p-2 transition-all duration-300 ${
        resolvedTheme === "dark" ? "bg-gray-900" : "bg-gray-200"
      }`}
    >
      {bookmarkLayoutSwitch(layout, {
        masonry: (
          <Masonry
            className="flex gap-2"
            breakpointCols={breakpointConfig}
            columnClassName="flex flex-col"
          >
            {children}
          </Masonry>
        ),
        grid: (
          <div className="`grid gap-2` grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {children}
          </div>
        ),
        list: <div className="grid grid-cols-1">{children}</div>,
      })}
      {hasNextPage && (
        <div className="flex justify-center">
          <ActionButton
            ignoreDemoMode={true}
            loading={isFetchingNextPage}
            onClick={() => fetchNextPage()}
            variant="ghost"
          >
            Load More
          </ActionButton>
        </div>
      )}
    </div>
  );
}
