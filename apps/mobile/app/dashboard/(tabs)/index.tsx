import { Platform, SafeAreaView, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import BookmarkList from "@/components/bookmarks/BookmarkList";
import PageTitle from "@/components/ui/PageTitle";
import { MenuView } from "@react-native-menu/menu";
import { SquarePen } from "lucide-react-native";

function HeaderRight() {
  const router = useRouter();
  return (
    <MenuView
      onPressAction={({ nativeEvent }) => {
        Haptics.selectionAsync();
        if (nativeEvent.event === "note") {
          router.navigate("dashboard/add-note");
        } else if (nativeEvent.event === "link") {
          router.navigate("dashboard/add-link");
        }
      }}
      actions={[
        {
          id: "link",
          title: "New Link",
          image: Platform.select({
            ios: "link",
            android: "ic_menu_link",
          }),
        },
        {
          id: "note",
          title: "New Note",
          image: Platform.select({
            ios: "note",
            android: "ic_menu_note",
          }),
        },
      ]}
      shouldOpenOnLongPress={false}
    >
      <View className="my-auto px-4">
        <SquarePen onPress={() => Haptics.selectionAsync()} />
      </View>
    </MenuView>
  );
}

export default function Home() {
  return (
    <SafeAreaView>
      <BookmarkList
        query={{ archived: false }}
        header={
          <View className="flex flex-row justify-between">
            <PageTitle title="Home" />
            <HeaderRight />
          </View>
        }
      />
    </SafeAreaView>
  );
}
