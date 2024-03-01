"use client";

import { api } from "@/lib/trpc";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import BookmarksGrid from "../bookmarks/components/BookmarksGrid";
import { Input } from "@/components/ui/input";
import Loading from "../bookmarks/loading";
import { keepPreviousData } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { ActionButton } from "@/components/ui/action-button";
import { Suspense, useRef } from "react";

function SearchComp() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q") || "";

  const { data, isPending, isPlaceholderData, error } =
    api.bookmarks.searchBookmarks.useQuery(
      {
        text: searchQuery,
      },
      {
        placeholderData: keepPreviousData,
      },
    );

  if (error) {
    throw error;
  }

  const inputRef: React.MutableRefObject<HTMLInputElement | null> =
    useRef<HTMLInputElement | null>(null);

  let timeoutId: NodeJS.Timeout | undefined;

  // Debounce user input
  const doSearch = () => {
    if (!inputRef.current) {
      return;
    }
    router.replace(`${pathname}?q=${inputRef.current.value}`);
  };

  const onInputChange = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      doSearch();
    }, 200);
  };

  return (
    <div className="container flex flex-col gap-3 p-4">
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          placeholder="Search"
          defaultValue={searchQuery}
          onChange={onInputChange}
        />
        <ActionButton
          loading={isPending || isPlaceholderData}
          onClick={doSearch}
        >
          <span className="flex gap-2">
            <Search />
            <span className="my-auto">Search</span>
          </span>
        </ActionButton>
      </div>
      <hr />
      {data ? (
        <BookmarksGrid
          query={{ ids: data.bookmarks.map((b) => b.id) }}
          bookmarks={data.bookmarks}
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
