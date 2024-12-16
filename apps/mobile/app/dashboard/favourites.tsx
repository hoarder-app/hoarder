import { useNavigation } from "expo-router";
import UpdatingBookmarkList from "@/components/bookmarks/UpdatingBookmarkList";
import CustomSafeAreaView from "@/components/ui/CustomSafeAreaView";

export default function Favourites() {
  const navigator = useNavigation();
  navigator.setOptions({
    headerTitle: "⭐️ Favourites",
    headerLargeTitle: true,
  });
  return (
    <CustomSafeAreaView>
      <UpdatingBookmarkList
        query={{
          favourited: true,
        }}
      />
    </CustomSafeAreaView>
  );
}
