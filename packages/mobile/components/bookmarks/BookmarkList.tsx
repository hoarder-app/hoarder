import { useEffect, useState } from "react";
import { FlatList } from "react-native";

import BookmarkCard from "./BookmarkCard";

import { api } from "@/lib/trpc";

export default function BookmarkList({
  favourited,
  archived,
}: {
  favourited?: boolean;
  archived?: boolean;
}) {
  const apiUtils = api.useUtils();
  const [refreshing, setRefreshing] = useState(false);
  const { data, isPending, isPlaceholderData } =
    api.bookmarks.getBookmarks.useQuery({
      favourited,
      archived,
    });

  useEffect(() => {
    setRefreshing(isPending || isPlaceholderData);
  }, [isPending, isPlaceholderData]);

  if (isPending || !data) {
    // TODO: Add a spinner
    return;
  }

  const onRefresh = () => {
    apiUtils.bookmarks.getBookmarks.invalidate();
    apiUtils.bookmarks.getBookmark.invalidate();
  };

  return (
    <FlatList
      contentContainerStyle={{
        gap: 10,
      }}
      renderItem={(b) => <BookmarkCard key={b.item.id} bookmark={b.item} />}
      data={data.bookmarks}
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  );
}
