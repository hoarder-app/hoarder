import { keepPreviousData } from "@tanstack/react-query";
import { useState } from "react";
import { View } from "react-native";
import { useDebounce } from "use-debounce";

import BookmarkList from "@/components/bookmarks/BookmarkList";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/trpc";

export default function Search() {
  const [search, setSearch] = useState("");

  const [query] = useDebounce(search, 200);

  const { data } = api.bookmarks.searchBookmarks.useQuery(
    { text: query },
    { placeholderData: keepPreviousData },
  );

  return (
    <View className="flex gap-2 p-2">
      <Input
        placeholder="Search"
        className="bg-white"
        value={search}
        onChangeText={setSearch}
        autoFocus
        autoCapitalize="none"
      />
      {data && <BookmarkList ids={data.bookmarks.map((b) => b.id)} />}
    </View>
  );
}
