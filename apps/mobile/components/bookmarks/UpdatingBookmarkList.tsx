import { Text } from "react-native";
import { api } from "@/lib/trpc";

import type { ZGetBookmarksRequest } from "@hoarder/shared/types/bookmarks";
import { BookmarkTypes } from "@hoarder/shared/types/bookmarks";

import FullPageSpinner from "../ui/FullPageSpinner";
import BookmarkList from "./BookmarkList";

export default function UpdatingBookmarkList({
  query,
  header,
}: {
  query: ZGetBookmarksRequest;
  header?: React.ReactElement;
}) {
  const apiUtils = api.useUtils();
  const {
    data,
    isPending,
    isPlaceholderData,
    error,
    fetchNextPage,
    isFetchingNextPage,
  } = api.bookmarks.getBookmarks.useInfiniteQuery(
    { ...query, useCursorV2: true },
    {
      initialCursor: null,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  if (error) {
    return <Text>{JSON.stringify(error)}</Text>;
  }

  if (isPending || !data) {
    return <FullPageSpinner />;
  }

  const onRefresh = () => {
    apiUtils.bookmarks.getBookmarks.invalidate();
    apiUtils.bookmarks.getBookmark.invalidate();
  };

  return (
    <BookmarkList
      bookmarks={data.pages
        .flatMap((p) => p.bookmarks)
        .filter((b) => b.content.type != BookmarkTypes.UNKNOWN)}
      header={header}
      onRefresh={onRefresh}
      fetchNextPage={fetchNextPage}
      isFetchingNextPage={isFetchingNextPage}
      isRefreshing={isPending || isPlaceholderData}
    />
  );
}
