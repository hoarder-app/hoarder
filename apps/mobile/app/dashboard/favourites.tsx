import { SafeAreaView } from "react-native";
import BookmarkList from "@/components/bookmarks/BookmarkList";
import PageTitle from "@/components/ui/PageTitle";

export default function Favourites() {
  return (
    <SafeAreaView>
      <BookmarkList
        archived={false}
        favourited
        header={<PageTitle title="⭐️ Favourites" />}
      />
    </SafeAreaView>
  );
}
