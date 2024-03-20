"use client";

import { api } from "@/lib/trpc";

import type {
  ZGetBookmarksRequest,
  ZGetBookmarksResponse,
} from "@hoarder/trpc/types/bookmarks";

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
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    api.bookmarks.getBookmarks.useInfiniteQuery(query, {
      initialData: () => ({
        pages: [initialBookmarks],
        pageParams: [query.cursor],
      }),
      initialCursor: null,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    });

  return (
    <BookmarksGrid
      bookmarks={data!.pages.flatMap((b) => b.bookmarks)}
      hasNextPage={hasNextPage}
      fetchNextPage={() => fetchNextPage()}
      isFetchingNextPage={isFetchingNextPage}
      showEditorCard={showEditorCard}
    />
  );
}
