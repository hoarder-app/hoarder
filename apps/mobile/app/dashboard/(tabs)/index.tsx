import { useRef } from "react";
import { Platform, View } from "react-native";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import NoteEditorModal from "@/components/bookmarks/NewBookmarkModal";
import UpdatingBookmarkList from "@/components/bookmarks/UpdatingBookmarkList";
import CustomSafeAreaView from "@/components/ui/CustomSafeAreaView";
import PageTitle from "@/components/ui/PageTitle";
import { useToast } from "@/components/ui/Toast";
import useAppSettings from "@/lib/settings";
import { useUploadAsset } from "@/lib/upload";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { MenuView } from "@react-native-menu/menu";
import { SquarePen } from "lucide-react-native";

function HeaderRight({
  openNewBookmarkModal,
}: {
  openNewBookmarkModal: () => void;
}) {
  const { toast } = useToast();
  const { settings } = useAppSettings();
  const { uploadAsset } = useUploadAsset(settings, {
    onError: (e) => {
      toast({ message: e, variant: "destructive" });
    },
  });
  return (
    <MenuView
      onPressAction={async ({ nativeEvent }) => {
        Haptics.selectionAsync();
        if (nativeEvent.event === "new") {
          openNewBookmarkModal();
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
          id: "new",
          title: "New Bookmark",
          image: Platform.select({
            ios: "note.text",
          }),
        },
        {
          id: "library",
          title: "Photo Library",
          image: Platform.select({
            ios: "photo",
          }),
        },
      ]}
      shouldOpenOnLongPress={false}
    >
      <View className="my-auto px-4">
        <SquarePen
          color="rgb(0, 122, 255)"
          onPress={() => Haptics.selectionAsync()}
        />
      </View>
    </MenuView>
  );
}

export default function Home() {
  const newBookmarkModal = useRef<BottomSheetModal>(null);

  return (
    <CustomSafeAreaView>
      <NoteEditorModal ref={newBookmarkModal} snapPoints={["90%", "60%"]} />
      <UpdatingBookmarkList
        query={{ archived: false }}
        header={
          <View className="flex flex-row justify-between">
            <PageTitle title="Home" />
            <HeaderRight
              openNewBookmarkModal={() => newBookmarkModal.current?.present()}
            />
          </View>
        }
      />
    </CustomSafeAreaView>
  );
}
