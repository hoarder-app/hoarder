import { useEffect, useRef, useState } from "react";
import { Keyboard, Text, View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { api } from "@/lib/trpc";
import { useScrollToTop } from "@react-navigation/native";

import FullPageSpinner from "../ui/FullPageSpinner";
import BookmarkCard from "./BookmarkCard";

export default function BookmarkList({
  favourited,
  archived,
  ids,
  header
}: {
  favourited?: boolean;
  archived?: boolean;
  ids?: string[];
  header?: React.ReactElement;
}) {
  const apiUtils = api.useUtils();
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef(null);
  useScrollToTop(flatListRef);
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
      ref={flatListRef}
      itemLayoutAnimation={LinearTransition}
      ListHeaderComponent={header}
      contentContainerStyle={{
        gap: 15,
        marginBottom: 15,
      }}
      renderItem={(b) => <BookmarkCard bookmark={b.item} />}
      ListEmptyComponent={
        <View className="items-center justify-center pt-4">
          <Text className="text-xl">No Bookmarks</Text>
        </View>
      }
      data={data.bookmarks}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onScrollBeginDrag={Keyboard.dismiss}
      keyExtractor={(b) => b.id}
    />
  );
}
