"use client";

import { Suspense, useRef } from "react";
import BookmarksGrid from "@/components/dashboard/bookmarks/BookmarksGrid";
import { SearchInput } from "@/components/dashboard/search/SearchInput";
import { FullPageSpinner } from "@/components/ui/full-page-spinner";
import { Separator } from "@/components/ui/separator";
import { useBookmarkSearch } from "@/lib/hooks/bookmark-search";

function SearchComp() {
  const { data } = useBookmarkSearch();

  const inputRef: React.MutableRefObject<HTMLInputElement | null> =
    useRef<HTMLInputElement | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <SearchInput ref={inputRef} autoFocus={true} />
      <Separator />
      {data ? (
        <BookmarksGrid bookmarks={data.bookmarks} />
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
