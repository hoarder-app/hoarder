"use client";

import { Suspense, useRef } from "react";
import BookmarksGrid from "@/components/dashboard/bookmarks/BookmarksGrid";
import { SearchInput } from "@/components/dashboard/search/SearchInput";
import { useBookmarkSearch } from "@/lib/hooks/bookmark-search";

import Loading from "../bookmarks/loading";

function SearchComp() {
  const { data } = useBookmarkSearch();

  const inputRef: React.MutableRefObject<HTMLInputElement | null> =
    useRef<HTMLInputElement | null>(null);

  return (
    <div className="container flex flex-col gap-3 p-4">
      <SearchInput ref={inputRef} autoFocus={true} />
      <hr />
      {data ? (
        <BookmarksGrid
          query={{ ids: data.bookmarks.map((b) => b.id) }}
          bookmarks={data}
        />
      ) : (
        <Loading />
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
