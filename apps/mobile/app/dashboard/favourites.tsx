import { SafeAreaView } from "react-native";
import UpdatingBookmarkList from "@/components/bookmarks/UpdatingBookmarkList";
import PageTitle from "@/components/ui/PageTitle";

export default function Favourites() {
  return (
    <SafeAreaView>
      <UpdatingBookmarkList
        query={{
          archived: false,
          favourited: true,
        }}
        header={<PageTitle title="⭐️ Favourites" />}
      />
    </SafeAreaView>
  );
}
