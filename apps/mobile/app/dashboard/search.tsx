import { useMemo, useRef, useState } from "react";
import {
  FlatList,
  Keyboard,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import BookmarkList from "@/components/bookmarks/BookmarkList";
import FullPageError from "@/components/FullPageError";
import CustomSafeAreaView from "@/components/ui/CustomSafeAreaView";
import FullPageSpinner from "@/components/ui/FullPageSpinner";
import { Input } from "@/components/ui/Input";
import { useSearchHistory } from "@/lib/hooks";
import { api } from "@/lib/trpc";
import { keepPreviousData } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";

const MAX_DISPLAY_SUGGESTIONS = 5;

export default function Search() {
  const [search, setSearch] = useState("");

  const [query] = useDebounce(search, 10);
  const inputRef = useRef<TextInput>(null);

  const [isInputFocused, setIsInputFocused] = useState(true);
  const { history, addTerm, clearHistory } = useSearchHistory();

  const onRefresh = api.useUtils().bookmarks.searchBookmarks.invalidate;

  const {
    data,
    error,
    refetch,
    isPending,
    isFetching,
    fetchNextPage,
    isFetchingNextPage,
  } = api.bookmarks.searchBookmarks.useInfiniteQuery(
    { text: query },
    {
      placeholderData: keepPreviousData,
      gcTime: 0,
      initialCursor: null,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const filteredHistory = useMemo(() => {
    if (search.trim().length === 0) {
      // Show recent items when not typing
      return history.slice(0, MAX_DISPLAY_SUGGESTIONS);
    }
    // Show filtered items when typing
    return history
      .filter((item) => item.toLowerCase().includes(search.toLowerCase()))
      .slice(0, MAX_DISPLAY_SUGGESTIONS);
  }, [search, history]);

  if (error) {
    return <FullPageError error={error.message} onRetry={() => refetch()} />;
  }

  const handleSearchSubmit = (searchTerm: string) => {
    const term = searchTerm.trim();
    if (term.length > 0) {
      addTerm(term);
      setSearch(term);
    }
    inputRef.current?.blur();
    Keyboard.dismiss();
  };

  const renderHistoryItem = ({ item }: { item: string }) => (
    <Pressable
      onPress={() => handleSearchSubmit(item)}
      className="border-b border-gray-200 p-3"
    >
      <Text className="text-foreground">{item}</Text>
    </Pressable>
  );

  const handleOnFocus = () => {
    setIsInputFocused(true);
  };

  const handleOnBlur = () => {
    setIsInputFocused(false);
    if (search.trim().length > 0) {
      addTerm(search);
    }
  };

  return (
    <CustomSafeAreaView>
      <View className="flex flex-row items-center gap-3 p-3">
        <Input
          ref={inputRef}
          placeholder="Search"
          className="flex-1"
          value={search}
          onChangeText={setSearch}
          onFocus={handleOnFocus}
          onBlur={handleOnBlur}
          onSubmitEditing={() => handleSearchSubmit(search)}
          returnKeyType="search"
          autoFocus
          autoCapitalize="none"
        />
        <Pressable onPress={() => router.back()}>
          <Text className="text-foreground">Cancel</Text>
        </Pressable>
      </View>

      {isInputFocused ? (
        <FlatList
          data={filteredHistory}
          renderItem={renderHistoryItem}
          keyExtractor={(item, index) => `${item}-${index}`}
          ListHeaderComponent={
            <View className="flex-row items-center justify-between p-3">
              <Text className="text-sm font-bold text-gray-500">
                Recent Searches
              </Text>
              {history.length > 0 && (
                <Pressable onPress={clearHistory}>
                  <Text className="text-sm text-blue-500">Clear</Text>
                </Pressable>
              )}
            </View>
          }
          ListEmptyComponent={
            <Text className="p-3 text-center text-gray-500">
              No matching searches.
            </Text>
          }
          keyboardShouldPersistTaps="handled"
        />
      ) : isFetching && query.length > 0 ? (
        <FullPageSpinner />
      ) : data && query.length > 0 ? (
        <BookmarkList
          bookmarks={data.pages.flatMap((p) => p.bookmarks)}
          fetchNextPage={fetchNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onRefresh={onRefresh}
          isRefreshing={isPending}
        />
      ) : (
        <View />
      )}
    </CustomSafeAreaView>
  );
}
