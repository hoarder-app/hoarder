import { SafeAreaView } from "react-native";
import BookmarkList from "@/components/bookmarks/BookmarkList";
import PageTitle from "@/components/ui/PageTitle";

export default function Favourites() {
  return (
    <SafeAreaView>
      <BookmarkList
        query={{
          archived: false,
          favourited: true,
        }}
        header={<PageTitle title="⭐️ Favourites" />}
      />
    </SafeAreaView>
  );
}
