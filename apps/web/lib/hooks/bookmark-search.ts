import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSortOrderStore } from "@/lib/store/useSortOrderStore";
import { api } from "@/lib/trpc";
import { keepPreviousData } from "@tanstack/react-query";

import { parseSearchQuery } from "@karakeep/shared/searchQueryParser";

export function useIsSearchPage() {
  const pathname = usePathname();
  return pathname.startsWith("/dashboard/search");
}

function useSearchQuery() {
  const searchParams = useSearchParams();
  const searchQuery = decodeURIComponent(searchParams.get("q") ?? "");

  const parsed = useMemo(() => parseSearchQuery(searchQuery), [searchQuery]);
  return { searchQuery, parsedSearchQuery: parsed };
}

export function useDoBookmarkSearch() {
  const router = useRouter();
  const { searchQuery, parsedSearchQuery } = useSearchQuery();
  const isInSearchPage = useIsSearchPage();
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | undefined>();

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
    isInSearchPage,
  };
}

export function useBookmarkSearch() {
  const { searchQuery } = useSearchQuery();
  const sortOrder = useSortOrderStore((state) => state.sortOrder);
  const { setSearchState, getSearchState, clearOldSearchStates } =
    useSortOrderStore();

  // Clean up old search states periodically
  useEffect(() => {
    clearOldSearchStates();

    // Also clean up on unmount
    return () => {
      clearOldSearchStates();
    };
  }, [clearOldSearchStates]);

  // Create a unique key for this search configuration
  // Include all search parameters that affect the results
  const searchKey = useMemo(() => {
    const searchParams = {
      text: searchQuery,
      sortOrder,
    };
    return JSON.stringify(searchParams);
  }, [searchQuery, sortOrder]);

  // Try to get existing search state
  const existingState = getSearchState(searchKey);

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
      // Try to restore from existing state if available
      initialData: existingState
        ? {
            pages: existingState.pages,
            pageParams: existingState.pageParams as (
              | ({ ver: 1; offset: number } | null)
              | undefined
            )[],
          }
        : undefined,
    },
  );

  // Save search state whenever data changes
  useEffect(() => {
    if (data && data.pages.length > 0) {
      setSearchState(searchKey, {
        pages: data.pages,
        pageParams: data.pageParams as ({ ver: 1; offset: number } | null)[],
        scrollPosition: window.scrollY,
      });
    }
  }, [data, searchKey, setSearchState]);

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
    searchKey, // Export for scroll position management
  };
}
