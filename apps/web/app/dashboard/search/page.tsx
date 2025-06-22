"use client";

import { Suspense, useEffect } from "react";
import BookmarksGrid from "@/components/dashboard/bookmarks/BookmarksGrid";
import { FullPageSpinner } from "@/components/ui/full-page-spinner";
import { useBookmarkSearch } from "@/lib/hooks/bookmark-search";
import { useSortOrderStore } from "@/lib/store/useSortOrderStore";

function SearchComp() {
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useBookmarkSearch();

  const { setSortOrder } = useSortOrderStore();

  useEffect(() => {
    // also see related cleanup code in SortOrderToggle.tsx
    setSortOrder("relevance");
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {data ? (
        <BookmarksGrid
          hasNextPage={hasNextPage}
          fetchNextPage={fetchNextPage}
          isFetchingNextPage={isFetchingNextPage}
          bookmarks={data.pages.flatMap((b) => b.bookmarks)}
        />
      ) : (
        <FullPageSpinner />
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchComp />
    </Suspense>
  );
}
