import { Platform, SafeAreaView, View } from "react-native";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import BookmarkList from "@/components/bookmarks/BookmarkList";
import PageTitle from "@/components/ui/PageTitle";
import useAppSettings from "@/lib/settings";
import { useUploadAsset } from "@/lib/upload";
import { MenuView } from "@react-native-menu/menu";
import { SquarePen } from "lucide-react-native";
import { useToast } from "@/components/ui/Toast";

function HeaderRight() {
  const {toast} = useToast();
  const router = useRouter();
  const { settings } = useAppSettings();
  const { uploadAsset } = useUploadAsset(settings, {
    onError: (e) => {
      toast({message: e, variant: "destructive"});
    },
  });
  return (
    <MenuView
      onPressAction={async ({ nativeEvent }) => {
        Haptics.selectionAsync();
        if (nativeEvent.event === "note") {
          router.navigate("dashboard/add-note");
        } else if (nativeEvent.event === "link") {
          router.navigate("dashboard/add-link");
        } else if (nativeEvent.event === "library") {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0,
            allowsMultipleSelection: false,
          });
          if (!result.canceled) {
            uploadAsset({
              type: result.assets[0].mimeType ?? "",
              name: result.assets[0].fileName ?? "",
              uri: result.assets[0].uri,
            });
          }
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
        {
          id: "library",
          title: "Photo Library",
          image: Platform.select({
            ios: "folder",
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
