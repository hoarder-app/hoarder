import { View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import BookmarkList from "@/components/bookmarks/BookmarkList";
import FullPageSpinner from "@/components/ui/FullPageSpinner";
import { api } from "@/lib/trpc";

export default function ListView() {
  const { slug } = useLocalSearchParams();
  if (typeof slug !== "string") {
    throw new Error("Unexpected param type");
  }
  const { data: list } = api.lists.get.useQuery({ listId: slug });

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: list ? `${list.icon} ${list.name}` : "Loading ...",
        }}
      />
      {list ? (
        <View>
          <BookmarkList archived={false} ids={list.bookmarks} />
        </View>
      ) : (
        <FullPageSpinner />
      )}
    </>
  );
}
