import { SafeAreaView, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import BookmarkList from "@/components/bookmarks/BookmarkList";
import FullPageSpinner from "@/components/ui/FullPageSpinner";
import PageTitle from "@/components/ui/PageTitle";
import { api } from "@/lib/trpc";

export default function TagView() {
  const { slug } = useLocalSearchParams();
  if (typeof slug !== "string") {
    throw new Error("Unexpected param type");
  }

  const { data: tag } = api.tags.get.useQuery({ tagId: slug });

  return (
    <SafeAreaView>
      <Stack.Screen
        options={{
          headerTitle: "",
          headerBackTitle: "Back",
          headerTransparent: true,
        }}
      />
      {tag ? (
        <View>
          <BookmarkList
            archived={false}
            ids={tag.bookmarks}
            header={<PageTitle title={tag.name} />}
          />
        </View>
      ) : (
        <FullPageSpinner />
      )}
    </SafeAreaView>
  );
}
