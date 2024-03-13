import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { api } from "@/lib/trpc";

import FullPageSpinner from "../ui/FullPageSpinner";
import BookmarkCard from "./BookmarkCard";

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
    return <FullPageSpinner />;
  }

  const onRefresh = () => {
    apiUtils.bookmarks.getBookmarks.invalidate();
    apiUtils.bookmarks.getBookmark.invalidate();
  };

  return (
    <Animated.FlatList
      itemLayoutAnimation={LinearTransition}
      contentContainerStyle={{
        gap: 15,
        marginVertical: 15,
        alignItems: "center",
      }}
      renderItem={(b) => <BookmarkCard bookmark={b.item} />}
      ListEmptyComponent={
        <View className="h-full items-center justify-center">
          <Text className="text-xl">No Bookmarks</Text>
        </View>
      }
      data={data.bookmarks}
      refreshing={refreshing}
      onRefresh={onRefresh}
      keyExtractor={(b) => b.id}
    />
  );
}
