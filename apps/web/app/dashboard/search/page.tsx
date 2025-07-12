"use client";

import { Suspense, useEffect } from "react";
import BookmarksGrid from "@/components/dashboard/bookmarks/BookmarksGrid";
import { SearchErrorBoundary } from "@/components/shared/SearchErrorBoundary";
import { FullPageSpinner } from "@/components/ui/full-page-spinner";
import { useBookmarkSearch } from "@/lib/hooks/bookmark-search";
import { useSortOrderStore } from "@/lib/store/useSortOrderStore";

function SearchComp() {
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, searchKey } =
    useBookmarkSearch();

  const { setSortOrder, getSearchState } = useSortOrderStore();

  useEffect(() => {
    // also see related cleanup code in SortOrderToggle.tsx
    setSortOrder("relevance");
  }, [setSortOrder]);

  // Restore scroll position when component mounts with existing data
  useEffect(() => {
    if (data && data.pages.length > 1) {
      // Only restore scroll if we have more than one page (indicating restored state)
      const savedState = getSearchState(searchKey);
      if (savedState && savedState.scrollPosition > 0) {
        // Use requestAnimationFrame to ensure the DOM is fully rendered
        requestAnimationFrame(() => {
          window.scrollTo(0, savedState.scrollPosition);
        });
      }
    }
  }, [data, searchKey, getSearchState]);

  return (
    <div className="flex flex-col gap-3">
      {data ? (
        <BookmarksGrid
          hasNextPage={hasNextPage}
          fetchNextPage={fetchNextPage}
          isFetchingNextPage={isFetchingNextPage}
          bookmarks={data.pages.flatMap((b) => b.bookmarks)}
          searchKey={searchKey}
          searchData={data}
        />
      ) : (
        <FullPageSpinner />
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <SearchErrorBoundary>
      <Suspense>
        <SearchComp />
      </Suspense>
    </SearchErrorBoundary>
  );
}
