import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/trpc";
import { keepPreviousData } from "@tanstack/react-query";

function useSearchQuery() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q") ?? "";
  return { searchQuery };
}

export function useDoBookmarkSearch() {
  const router = useRouter();
  const { searchQuery } = useSearchQuery();
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
    router.replace(`/dashboard/search?q=${val}`);
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
    isInSearchPage: pathname.startsWith("/dashboard/search"),
  };
}

export function useBookmarkSearch() {
  const { searchQuery } = useSearchQuery();

  const {
    data,
    isPending,
    isPlaceholderData,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = api.bookmarks.searchBookmarks.useInfiniteQuery(
    {
      text: searchQuery,
    },
    {
      placeholderData: keepPreviousData,
      gcTime: 0,
      initialCursor: null,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  if (error) {
    throw error;
  }

  return {
    searchQuery,
    error,
    data,
    isPending,
    isPlaceholderData,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  };
}
