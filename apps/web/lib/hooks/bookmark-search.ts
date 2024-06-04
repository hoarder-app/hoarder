import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/trpc";
import { keepPreviousData } from "@tanstack/react-query";

export function useSearchQuery() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q") ?? "";
  const advanced = searchParams.get("advanced") ?? "";
  return { searchQuery, advanced };
}

export function useDoBookmarkSearch() {
  const router = useRouter();
  const { searchQuery } = useSearchQuery();
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | undefined>();

  useEffect(() => {
    return () => {
      if (!timeoutId) {
        return;
      }
      clearTimeout(timeoutId);
    };
  }, [timeoutId]);

  const doSearch = (val: string, advanced: boolean) => {
    setTimeoutId(undefined);
    router.replace(`/dashboard/search?q=${val}&advanced=${advanced}`);
  };

  const debounceSearch = (val: string, advanced: boolean) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    const id = setTimeout(() => {
      doSearch(val, advanced);
    }, 10);
    setTimeoutId(id);
  };

  return {
    doSearch,
    debounceSearch,
    searchQuery,
  };
}

export function useBookmarkSearch() {
  const { searchQuery, advanced } = useSearchQuery();

  const { data, isPending, isPlaceholderData, error } =
    api.bookmarks.searchBookmarks.useQuery(
      {
        text: searchQuery,
        advanced: advanced,
      },
      {
        placeholderData: keepPreviousData,
        gcTime: 0,
      },
    );

  if (error) {
    throw error;
  }

  return {
    searchQuery,
    advanced: advanced === "true",
    error,
    data,
    isPending,
    isPlaceholderData,
  };
}
