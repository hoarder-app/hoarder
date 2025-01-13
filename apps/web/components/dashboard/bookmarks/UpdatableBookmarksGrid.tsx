"use client";

import { useEffect } from "react";
import UploadDropzone from "@/components/dashboard/UploadDropzone";
import { useSortOrderStore } from "@/lib/store/useSortOrderStore";
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
  query: Omit<ZGetBookmarksRequest, "sortOrder">; // Sort order is handled by the store
  bookmarks: ZGetBookmarksResponse;
  showEditorCard?: boolean;
  itemsPerPage?: number;
}) {
  const sortOrder = useSortOrderStore((state) => state.sortOrder);

  const finalQuery = { ...query, sortOrder };

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
    <BookmarkGridContextProvider query={finalQuery}>
      {showEditorCard ? <UploadDropzone>{grid}</UploadDropzone> : grid}
    </BookmarkGridContextProvider>
  );
}
