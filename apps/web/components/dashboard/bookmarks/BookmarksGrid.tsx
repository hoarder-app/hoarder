import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import NoBookmarksBanner from "@/components/dashboard/bookmarks/NoBookmarksBanner";
import { ActionButton } from "@/components/ui/action-button";
import useBulkActionsStore from "@/lib/bulkActions";
import { useSortOrderStore } from "@/lib/store/useSortOrderStore";
import {
  bookmarkLayoutSwitch,
  useBookmarkLayout,
} from "@/lib/userLocalSettings/bookmarksLayout";
import tailwindConfig from "@/tailwind.config";
import { Slot } from "@radix-ui/react-slot";
import { ErrorBoundary } from "react-error-boundary";
import { useInView } from "react-intersection-observer";
import Masonry from "react-masonry-css";
import resolveConfig from "tailwindcss/resolveConfig";

import type {
  ZBookmark,
  ZBookmarksSearchResult,
  ZSearchBookmarksCursor,
} from "@karakeep/shared/types/bookmarks";

import BookmarkCard from "./BookmarkCard";
import EditorCard from "./EditorCard";
import UnknownCard from "./UnknownCard";

// Constants
const SCROLL_DEBOUNCE_DELAY = 100; // ms

function StyledBookmarkCard({ children }: { children: React.ReactNode }) {
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

export default function BookmarksGrid({
  bookmarks,
  hasNextPage = false,
  fetchNextPage = () => ({}),
  isFetchingNextPage = false,
  showEditorCard = false,
  searchKey, // Optional search key for scroll position tracking
  searchData, // Optional search data for scroll position tracking
}: {
  bookmarks: ZBookmark[];
  showEditorCard?: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
  searchKey?: string; // For search pages to track scroll position
  searchData?: {
    pages: ZBookmarksSearchResult[];
    pageParams: (ZSearchBookmarksCursor | null | undefined)[];
  }; // For search pages to track scroll position
}) {
  const layout = useBookmarkLayout();
  const bulkActionsStore = useBulkActionsStore();
  const pathname = usePathname();
  const isSearchPage = pathname.startsWith("/dashboard/search");
  const { setSearchState, getSearchState } = useSortOrderStore();
  const breakpointConfig = useMemo(() => getBreakpointConfig(), []);
  const { ref: loadMoreRef, inView: loadMoreButtonInView } = useInView();

  useEffect(() => {
    bulkActionsStore.setVisibleBookmarks(bookmarks);
    return () => {
      bulkActionsStore.setVisibleBookmarks([]);
    };
  }, [bookmarks]);

  useEffect(() => {
    if (loadMoreButtonInView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [loadMoreButtonInView]);

  // Track scroll position for search pages
  useEffect(() => {
    if (
      !isSearchPage ||
      !searchKey ||
      !searchData ||
      searchData.pages.length === 0
    )
      return;

    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      // Debounce scroll updates
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const currentState = getSearchState(searchKey);
        if (currentState) {
          setSearchState(searchKey, {
            ...currentState,
            scrollPosition: window.scrollY,
          });
        }
      }, SCROLL_DEBOUNCE_DELAY);
    };

    // Wait for DOM to be ready before adding scroll listener
    const timeoutForInit = setTimeout(() => {
      window.addEventListener("scroll", handleScroll, { passive: true });
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutForInit);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isSearchPage, searchKey, setSearchState, getSearchState, searchData]);

  if (bookmarks.length == 0 && !showEditorCard) {
    return <NoBookmarksBanner />;
  }

  const children = [
    showEditorCard && (
      <StyledBookmarkCard key={"editor"}>
        <EditorCard />
      </StyledBookmarkCard>
    ),
    ...bookmarks.map((b) => (
      <ErrorBoundary key={b.id} fallback={<UnknownCard bookmark={b} />}>
        <StyledBookmarkCard>
          <BookmarkCard bookmark={b} />
        </StyledBookmarkCard>
      </ErrorBoundary>
    )),
  ];
  return (
    <>
      {bookmarkLayoutSwitch(layout, {
        masonry: (
          <Masonry className="flex gap-4" breakpointCols={breakpointConfig}>
            {children}
          </Masonry>
        ),
        grid: (
          <Masonry className="flex gap-4" breakpointCols={breakpointConfig}>
            {children}
          </Masonry>
        ),
        list: <div className="grid grid-cols-1">{children}</div>,
        compact: <div className="grid grid-cols-1">{children}</div>,
      })}
      {hasNextPage && (
        <div className="flex justify-center">
          <ActionButton
            ref={loadMoreRef}
            ignoreDemoMode={true}
            loading={isFetchingNextPage}
            onClick={() => fetchNextPage()}
            variant="ghost"
          >
            Load More
          </ActionButton>
        </div>
      )}
    </>
  );
}
