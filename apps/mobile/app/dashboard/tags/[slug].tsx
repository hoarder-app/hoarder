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

  const { data: tag } = api.tags.get.useQuery({ tagId: slug });

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: tag ? `${tag.name}` : "Loading ...",
        }}
      />
      {tag ? (
        <View>
          <BookmarkList archived={false} ids={tag.bookmarks} />
        </View>
      ) : (
        <FullPageSpinner />
      )}
    </>
  );
}
