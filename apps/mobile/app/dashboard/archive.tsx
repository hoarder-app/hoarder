import UpdatingBookmarkList from "@/components/bookmarks/UpdatingBookmarkList";
import PageTitle from "@/components/ui/PageTitle";
import CustomSafeAreaView from "@/components/ui/CustomSafeAreaView";

export default function Archive() {
  return (
    <CustomSafeAreaView>
      <UpdatingBookmarkList query={{archived: true}} header={<PageTitle title="🗄️ Archive" />} />
    </CustomSafeAreaView>
  );
}
