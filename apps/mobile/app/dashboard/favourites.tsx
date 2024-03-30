import UpdatingBookmarkList from "@/components/bookmarks/UpdatingBookmarkList";
import CustomSafeAreaView from "@/components/ui/CustomSafeAreaView";
import PageTitle from "@/components/ui/PageTitle";

export default function Favourites() {
  return (
    <CustomSafeAreaView>
      <UpdatingBookmarkList
        query={{
          archived: false,
          favourited: true,
        }}
        header={<PageTitle title="⭐️ Favourites" />}
      />
    </CustomSafeAreaView>
  );
}
