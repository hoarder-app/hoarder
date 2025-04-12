import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSortOrderStore } from "@/lib/store/useSortOrderStore";
import { api } from "@/lib/trpc";
import { keepPreviousData } from "@tanstack/react-query";

import { parseSearchQuery } from "@karakeep/shared/searchQueryParser";

function useSearchQuery() {
  const searchParams = useSearchParams();
  const searchQuery = decodeURIComponent(searchParams.get("q") ?? "");

  const parsed = useMemo(() => parseSearchQuery(searchQuery), [searchQuery]);
  return { searchQuery, parsedSearchQuery: parsed };
}

export function useDoBookmarkSearch() {
  const router = useRouter();
  const { searchQuery, parsedSearchQuery } = useSearchQuery();
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | undefined>();
  const pathname = usePathname();

  useEffect(() => {
    return () => {
      if (!timeoutId) {
        return;
      }
      clearTimeout(timeoutId);
    };
  }, [timeoutId]);

  const doSearch = (val: string) => {
    setTimeoutId(undefined);
    router.replace(`/dashboard/search?q=${encodeURIComponent(val)}`);
  };

  const debounceSearch = (val: string) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    const id = setTimeout(() => {
      doSearch(val);
    }, 10);
    setTimeoutId(id);
  };

  return {
    doSearch,
    debounceSearch,
    searchQuery,
    parsedSearchQuery,
    isInSearchPage: pathname.startsWith("/dashboard/search"),
  };
}

export function useBookmarkSearch() {
  const { searchQuery } = useSearchQuery();
  const sortOrder = useSortOrderStore((state) => state.sortOrder);

  const {
    data,
    isPending,
    isPlaceholderData,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
  } = api.bookmarks.searchBookmarks.useInfiniteQuery(
    {
      text: searchQuery,
      sortOrder,
    },
    {
      placeholderData: keepPreviousData,
      gcTime: 0,
      initialCursor: null,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  useEffect(() => {
    refetch();
  }, [refetch, sortOrder]);

  if (error) {
    throw error;
  }

  return {
    error,
    data,
    isPending,
    isPlaceholderData,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  };
}
