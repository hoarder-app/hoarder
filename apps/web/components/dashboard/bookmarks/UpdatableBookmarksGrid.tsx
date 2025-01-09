"use client";

import { useEffect } from "react";
import UploadDropzone from "@/components/dashboard/UploadDropzone";
import { useSortOrder } from "@/lib/hooks/useSortOrder";
import { api } from "@/lib/trpc";

import type {
  ZGetBookmarksRequest,
  ZGetBookmarksResponse,
} from "@hoarder/shared/types/bookmarks";
import { BookmarkGridContextProvider } from "@hoarder/shared-react/hooks/bookmark-grid-context";

import BookmarksGrid from "./BookmarksGrid";

export default function UpdatableBookmarksGrid({
  query,
  bookmarks: initialBookmarks,
  showEditorCard = false,
}: {
  query: ZGetBookmarksRequest;
  bookmarks: ZGetBookmarksResponse;
  showEditorCard?: boolean;
  itemsPerPage?: number;
}) {
  const { sortOrder } = useSortOrder();

  // Merge the sort order from URL with existing query params
  const finalQuery = {
    ...query,
    sortOrder,
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    api.bookmarks.getBookmarks.useInfiniteQuery(
      { ...finalQuery, useCursorV2: true },
      {
        initialData: () => ({
          pages: [initialBookmarks],
          pageParams: [query.cursor],
        }),
        initialCursor: null,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        refetchOnMount: true,
      },
    );

  useEffect(() => {
    refetch();
  }, [sortOrder, refetch]);

  const grid = (
    <BookmarksGrid
      bookmarks={data!.pages.flatMap((b) => b.bookmarks)}
      hasNextPage={hasNextPage}
      fetchNextPage={fetchNextPage}
      isFetchingNextPage={isFetchingNextPage}
      showEditorCard={showEditorCard}
    />
  );

  return (
    <BookmarkGridContextProvider query={query}>
      {showEditorCard ? <UploadDropzone>{grid}</UploadDropzone> : grid}
    </BookmarkGridContextProvider>
  );
}
