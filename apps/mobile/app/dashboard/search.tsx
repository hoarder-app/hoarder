import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import BookmarkList from "@/components/bookmarks/BookmarkList";
import FullPageError from "@/components/FullPageError";
import CustomSafeAreaView from "@/components/ui/CustomSafeAreaView";
import FullPageSpinner from "@/components/ui/FullPageSpinner";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/trpc";
import { keepPreviousData } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";

export default function Search() {
  const [search, setSearch] = useState("");

  const [query] = useDebounce(search, 10);

  const onRefresh = api.useUtils().bookmarks.searchBookmarks.invalidate;

  const { data, error, refetch, isPending, fetchNextPage, isFetchingNextPage } =
    api.bookmarks.searchBookmarks.useInfiniteQuery(
      { text: query },
      {
        placeholderData: keepPreviousData,
        gcTime: 0,
        initialCursor: null,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    );

  if (error) {
    return <FullPageError error={error.message} onRetry={() => refetch()} />;
  }

  return (
    <CustomSafeAreaView>
      <View className="flex flex-row items-center gap-3 p-3">
        <Input
          placeholder="Search"
          className="flex-1"
          value={search}
          onChangeText={setSearch}
          autoFocus
          autoCapitalize="none"
        />
        <Pressable onPress={() => router.back()}>
          <Text className="text-foreground">Cancel</Text>
        </Pressable>
      </View>
      {!data && <FullPageSpinner />}
      {data && (
        <BookmarkList
          bookmarks={data.pages.flatMap((p) => p.bookmarks)}
          fetchNextPage={fetchNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onRefresh={onRefresh}
          isRefreshing={isPending}
        />
      )}
    </CustomSafeAreaView>
  );
}
