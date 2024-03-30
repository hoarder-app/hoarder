import UpdatingBookmarkList from "@/components/bookmarks/UpdatingBookmarkList";
import CustomSafeAreaView from "@/components/ui/CustomSafeAreaView";
import PageTitle from "@/components/ui/PageTitle";

export default function Archive() {
  return (
    <CustomSafeAreaView>
      <UpdatingBookmarkList
        query={{ archived: true }}
        header={<PageTitle title="🗄️ Archive" />}
      />
    </CustomSafeAreaView>
  );
}
