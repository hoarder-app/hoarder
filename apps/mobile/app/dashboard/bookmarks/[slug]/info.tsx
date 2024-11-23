import React from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import TagPill from "@/components/bookmarks/TagPill";
import FullPageError from "@/components/FullPageError";
import CustomSafeAreaView from "@/components/ui/CustomSafeAreaView";
import FullPageSpinner from "@/components/ui/FullPageSpinner";
import { Input } from "@/components/ui/Input";
import PageTitle from "@/components/ui/PageTitle";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/trpc";

import { useUpdateBookmark } from "@hoarder/shared-react/hooks/bookmarks";
import { isBookmarkStillTagging } from "@hoarder/shared-react/utils/bookmarkUtils";
import { BookmarkTypes, ZBookmark } from "@hoarder/shared/types/bookmarks";

function TagList({ bookmark }: { bookmark: ZBookmark }) {
  return (
    <View className="flex flex-row items-center gap-4">
      <Text className="text-foreground">Tags</Text>
      {isBookmarkStillTagging(bookmark) ? (
        <>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </>
      ) : bookmark.tags.length > 0 ? (
        <View className="flex flex-row flex-wrap gap-2">
          {bookmark.tags.map((t) => (
            <TagPill key={t.id} tag={t} />
          ))}
        </View>
      ) : (
        <Text className="text-foreground">No tags</Text>
      )}
    </View>
  );
}

function NotesEditor({ bookmark }: { bookmark: ZBookmark }) {
  const { mutate, isPending } = useUpdateBookmark();
  return (
    <View className="flex flex-row items-center gap-4">
      <Text className="text-foreground">Notes</Text>

      <Input
        className="flex-1"
        editable={!isPending}
        multiline={true}
        numberOfLines={3}
        loading={isPending}
        placeholder="Notes"
        textAlignVertical="top"
        onEndEditing={(ev) =>
          mutate({
            bookmarkId: bookmark.id,
            note: ev.nativeEvent.text,
          })
        }
        defaultValue={bookmark.note ?? ""}
      />
    </View>
  );
}

const ViewBookmarkPage = () => {
  const { slug } = useLocalSearchParams();
  if (typeof slug !== "string") {
    throw new Error("Unexpected param type");
  }
  const {
    data: bookmark,
    isPending,
    refetch,
  } = api.bookmarks.getBookmark.useQuery({ bookmarkId: slug });

  if (isPending) {
    return <FullPageSpinner />;
  }

  if (!bookmark) {
    return (
      <FullPageError error="Bookmark not found" onRetry={() => refetch()} />
    );
  }

  let title = null;
  switch (bookmark.content.type) {
    case BookmarkTypes.LINK:
      title = bookmark.title ?? bookmark.content.title;
      break;
    case BookmarkTypes.TEXT:
      title = bookmark.title;
      break;
    case BookmarkTypes.ASSET:
      title = bookmark.title ?? bookmark.content.fileName;
      break;
  }
  return (
    <CustomSafeAreaView>
      <View className="h-screen w-full">
        <PageTitle title={title ?? "Untitled"} className="line-clamp-2" />
        <View className="gap-4 px-4">
          <TagList bookmark={bookmark} />
          <NotesEditor bookmark={bookmark} />
        </View>
      </View>
    </CustomSafeAreaView>
  );
};

export default ViewBookmarkPage;
