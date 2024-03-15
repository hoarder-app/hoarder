import { useState } from "react";
import { SafeAreaView, View } from "react-native";
import BookmarkList from "@/components/bookmarks/BookmarkList";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/trpc";
import { keepPreviousData } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import PageTitle from "@/components/ui/PageTitle";

export default function Search() {
  const [search, setSearch] = useState("");

  const [query] = useDebounce(search, 200);

  const { data } = api.bookmarks.searchBookmarks.useQuery(
    { text: query },
    { placeholderData: keepPreviousData },
  );

  return (
    <SafeAreaView>
      {data && (
        <BookmarkList
          ids={data.bookmarks.map((b) => b.id)}
          header={
            <View>
              <PageTitle title="Search" />
              <Input
                placeholder="Search"
                className="mx-4 bg-white"
                value={search}
                onChangeText={setSearch}
                autoFocus
                autoCapitalize="none"
              />
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
