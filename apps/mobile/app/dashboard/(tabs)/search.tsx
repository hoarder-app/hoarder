import { useState } from "react";
import { View } from "react-native";
import BookmarkList from "@/components/bookmarks/BookmarkList";
import { Divider } from "@/components/ui/Divider";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/trpc";
import { keepPreviousData } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";

export default function Search() {
  const [search, setSearch] = useState("");

  const [query] = useDebounce(search, 200);

  const { data } = api.bookmarks.searchBookmarks.useQuery(
    { text: query },
    { placeholderData: keepPreviousData },
  );

  return (
    <View>
      <Input
        placeholder="Search"
        className="mx-4 mt-4 bg-white"
        value={search}
        onChangeText={setSearch}
        autoFocus
        autoCapitalize="none"
      />
      <Divider orientation="horizontal" className="mt-4 w-full" />
      {data && <BookmarkList ids={data.bookmarks.map((b) => b.id)} />}
    </View>
  );
}
