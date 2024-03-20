import { SafeAreaView } from "react-native";
import UpdatingBookmarkList from "@/components/bookmarks/UpdatingBookmarkList";
import PageTitle from "@/components/ui/PageTitle";

export default function Archive() {
  return (
    <SafeAreaView>
      <UpdatingBookmarkList query={{archived: true}} header={<PageTitle title="🗄️ Archive" />} />
    </SafeAreaView>
  );
}
