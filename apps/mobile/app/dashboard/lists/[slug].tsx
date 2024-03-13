import { useLocalSearchParams, Stack } from "expo-router";
import { View } from "react-native";

import BookmarkList from "@/components/bookmarks/BookmarkList";
import FullPageSpinner from "@/components/ui/FullPageSpinner";
import { api } from "@/lib/trpc";

export default function ListView() {
  const { slug } = useLocalSearchParams();
  if (typeof slug !== "string") {
    throw new Error("Unexpected param type");
  }
  const { data: list } = api.lists.get.useQuery({ listId: slug });

  if (!list) {
    return <FullPageSpinner />;
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: `${list.icon} ${list.name}`,
        }}
      />
      <View>
        <BookmarkList archived={false} ids={list.bookmarks} />
      </View>
    </>
  );
}
