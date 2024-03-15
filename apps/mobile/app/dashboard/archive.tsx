import { SafeAreaView } from "react-native";
import BookmarkList from "@/components/bookmarks/BookmarkList";
import PageTitle from "@/components/ui/PageTitle";

export default function Archive() {
  return (
    <SafeAreaView>
      <BookmarkList archived header={<PageTitle title="🗄️ Archive" />} />
    </SafeAreaView>
  );
}
