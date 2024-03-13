import { useEffect, useState } from "react";
import { FlatList, Text, View } from "react-native";

import BookmarkCard from "./BookmarkCard";

import { api } from "@/lib/trpc";

export default function BookmarkList({
  favourited,
  archived,
  ids,
}: {
  favourited?: boolean;
  archived?: boolean;
  ids?: string[];
}) {
  const apiUtils = api.useUtils();
  const [refreshing, setRefreshing] = useState(false);
  const { data, isPending, isPlaceholderData } =
    api.bookmarks.getBookmarks.useQuery({
      favourited,
      archived,
      ids,
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

  if (!data.bookmarks.length) {
    return (
      <View className="h-full items-center justify-center">
        <Text className="text-xl">No Bookmarks</Text>
      </View>
    );
  }

  return (
    <View className="px-3">
      <FlatList
        contentContainerStyle={{
          marginTop: 10,
          gap: 10,
        }}
        renderItem={(b) => <BookmarkCard key={b.item.id} bookmark={b.item} />}
        data={data.bookmarks}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </View>
  );
}
