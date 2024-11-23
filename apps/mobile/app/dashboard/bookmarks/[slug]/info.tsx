import React from "react";
import {
  Keyboard,
  Pressable,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { router, Stack, useLocalSearchParams } from "expo-router";
import TagPill from "@/components/bookmarks/TagPill";
import FullPageError from "@/components/FullPageError";
import CustomSafeAreaView from "@/components/ui/CustomSafeAreaView";
import FullPageSpinner from "@/components/ui/FullPageSpinner";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/trpc";
import { ChevronRight } from "lucide-react-native";

import { useUpdateBookmark } from "@hoarder/shared-react/hooks/bookmarks";
import { isBookmarkStillTagging } from "@hoarder/shared-react/utils/bookmarkUtils";
import { BookmarkTypes, ZBookmark } from "@hoarder/shared/types/bookmarks";

function TagList({ bookmark }: { bookmark: ZBookmark }) {
  return (
    <View className="flex gap-4">
      <Text className="text-lg text-foreground">Tags</Text>
      {isBookmarkStillTagging(bookmark) ? (
        <>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </>
      ) : bookmark.tags.length > 0 ? (
        <View className="flex flex-row flex-wrap gap-2 rounded-lg bg-background p-4">
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

function ManageLists({ bookmark }: { bookmark: ZBookmark }) {
  return (
    <View className="flex gap-4">
      <Text className="text-lg text-foreground">Lists</Text>
      <Pressable
        onPress={() =>
          router.push(`/dashboard/bookmarks/${bookmark.id}/manage_lists`)
        }
        className="flex w-full flex-row justify-between gap-3 rounded-lg bg-white px-4 py-2 dark:bg-accent"
      >
        <Text className="text-lg text-accent-foreground">Manage Lists</Text>
        <ChevronRight color="rgb(0, 122, 255)" />
      </Pressable>
    </View>
  );
}

function TitleEditor({
  bookmarkId,
  title,
}: {
  bookmarkId: string;
  title: string;
}) {
  const { mutate, isPending } = useUpdateBookmark();
  return (
    <View className="flex gap-4">
      <Text className="text-lg text-foreground">Title</Text>

      <Input
        editable={!isPending}
        multiline={true}
        numberOfLines={3}
        loading={isPending}
        placeholder="Title"
        textAlignVertical="top"
        onEndEditing={(ev) =>
          mutate({
            bookmarkId,
            title: ev.nativeEvent.text ? ev.nativeEvent.text : null,
          })
        }
        defaultValue={title ?? ""}
      />
    </View>
  );
}

function NotesEditor({ bookmark }: { bookmark: ZBookmark }) {
  const { mutate, isPending } = useUpdateBookmark();
  return (
    <View className="flex gap-4">
      <Text className="text-lg text-foreground">Notes</Text>

      <Input
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
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: title ?? "Untitled",
        }}
      />
      <ScrollView className="h-screen w-full p-4">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="gap-4 px-2">
            <TitleEditor bookmarkId={bookmark.id} title={title ?? ""} />
            <TagList bookmark={bookmark} />
            <ManageLists bookmark={bookmark} />
            <NotesEditor bookmark={bookmark} />
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </CustomSafeAreaView>
  );
};

export default ViewBookmarkPage;
