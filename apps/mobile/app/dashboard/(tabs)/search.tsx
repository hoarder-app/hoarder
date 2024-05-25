import { useState } from "react";
import { View } from "react-native";
import BookmarkList from "@/components/bookmarks/BookmarkList";
import CustomSafeAreaView from "@/components/ui/CustomSafeAreaView";
import FullPageSpinner from "@/components/ui/FullPageSpinner";
import { Input } from "@/components/ui/Input";
import PageTitle from "@/components/ui/PageTitle";
import { api } from "@/lib/trpc";
import { keepPreviousData } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";

export default function Search() {
  const [search, setSearch] = useState("");

  const [query] = useDebounce(search, 10);

  const onRefresh = api.useUtils().bookmarks.searchBookmarks.invalidate;

  const { data, isPending } = api.bookmarks.searchBookmarks.useQuery(
    { text: query },
    { placeholderData: keepPreviousData },
  );

  if (!data) {
    return <FullPageSpinner />;
  }

  return (
    <CustomSafeAreaView>
      <BookmarkList
        bookmarks={data.bookmarks}
        header={
          <View>
            <PageTitle title="Search" />
            <Input
              placeholder="Search"
              className="mx-1"
              value={search}
              onChangeText={setSearch}
              autoFocus
              autoCapitalize="none"
            />
          </View>
        }
        onRefresh={onRefresh}
        isRefreshing={isPending}
      />
    </CustomSafeAreaView>
  );
}
