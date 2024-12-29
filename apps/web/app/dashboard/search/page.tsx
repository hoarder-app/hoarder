"use client";

import { Suspense } from "react";
import BookmarksGrid from "@/components/dashboard/bookmarks/BookmarksGrid";
import { FullPageSpinner } from "@/components/ui/full-page-spinner";
import { useBookmarkSearch } from "@/lib/hooks/bookmark-search";

function SearchComp() {
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useBookmarkSearch();

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
