import UpdatingBookmarkList from "@/components/bookmarks/UpdatingBookmarkList";
import PageTitle from "@/components/ui/PageTitle";
import CustomSafeAreaView from "@/components/ui/CustomSafeAreaView";

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
