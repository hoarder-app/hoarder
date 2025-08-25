import React from "react";
import { Alert, Pressable, View } from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardGestureArea,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, Stack, useLocalSearchParams } from "expo-router";
import TagPill from "@/components/bookmarks/TagPill";
import FullPageError from "@/components/FullPageError";
import { Button } from "@/components/ui/Button";
import ChevronRight from "@/components/ui/ChevronRight";
import { Divider } from "@/components/ui/Divider";
import { Form, FormItem, FormSection } from "@/components/ui/Form";
import FullPageSpinner from "@/components/ui/FullPageSpinner";
import { Skeleton } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Text";
import { TextField } from "@/components/ui/TextField";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

import {
  useAutoRefreshingBookmarkQuery,
  useDeleteBookmark,
  useUpdateBookmark,
} from "@karakeep/shared-react/hooks/bookmarks";
import { BookmarkTypes, ZBookmark } from "@karakeep/shared/types/bookmarks";
import { isBookmarkStillTagging } from "@karakeep/shared/utils/bookmarkUtils";

function InfoSection({
  className,
  ...props
}: React.ComponentProps<typeof FormSection>) {
  return (
    <FormSection
      className={cn("flex gap-2 rounded-lg bg-card p-3", className)}
      {...props}
    />
  );
}

function TagList({ bookmark }: { bookmark: ZBookmark }) {
  return (
    <InfoSection>
      {isBookmarkStillTagging(bookmark) ? (
        <View className="flex gap-4 pb-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </View>
      ) : (
        bookmark.tags.length > 0 && (
          <>
            <FormItem className="flex flex-row flex-wrap gap-2 rounded-lg p-2">
              {bookmark.tags.map((t) => (
                <TagPill key={t.id} tag={t} />
              ))}
            </FormItem>
            <Divider orientation="horizontal" />
          </>
        )
      )}
      <FormItem>
        <Pressable
          onPress={() =>
            router.push(`/dashboard/bookmarks/${bookmark.id}/manage_tags`)
          }
          className="flex w-full flex-row justify-between gap-3"
        >
          <Text>Manage Tags</Text>
          <ChevronRight />
        </Pressable>
      </FormItem>
    </InfoSection>
  );
}

function ManageLists({ bookmark }: { bookmark: ZBookmark }) {
  return (
    <InfoSection>
      <FormItem>
        <Pressable
          onPress={() =>
            router.push(`/dashboard/bookmarks/${bookmark.id}/manage_lists`)
          }
          className="flex w-full flex-row justify-between gap-3 rounded-lg"
        >
          <Text>Manage Lists</Text>
          <ChevronRight />
        </Pressable>
      </FormItem>
    </InfoSection>
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
    <InfoSection>
      <FormItem>
        <TextField
          editable={!isPending}
          multiline={false}
          numberOfLines={1}
          placeholder="Title"
          onEndEditing={(ev) =>
            mutate({
              bookmarkId,
              title: ev.nativeEvent.text ? ev.nativeEvent.text : null,
            })
          }
          defaultValue={title ?? ""}
        />
      </FormItem>
    </InfoSection>
  );
}

function NotesEditor({ bookmark }: { bookmark: ZBookmark }) {
  const { mutate, isPending } = useUpdateBookmark();
  return (
    <InfoSection>
      <FormItem>
        <TextField
          editable={!isPending}
          multiline={true}
          placeholder="Notes"
          onEndEditing={(ev) =>
            mutate({
              bookmarkId: bookmark.id,
              note: ev.nativeEvent.text,
            })
          }
          defaultValue={bookmark.note ?? ""}
        />
      </FormItem>
    </InfoSection>
  );
}

const ViewBookmarkPage = () => {
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams();
  const { toast } = useToast();
  if (typeof slug !== "string") {
    throw new Error("Unexpected param type");
  }

  const { mutate: deleteBookmark, isPending: isDeletionPending } =
    useDeleteBookmark({
      onSuccess: () => {
        router.replace("dashboard");
        toast({
          message: "The bookmark has been deleted!",
          showProgress: false,
        });
      },
    });

  const {
    data: bookmark,
    isPending,
    refetch,
  } = useAutoRefreshingBookmarkQuery({
    bookmarkId: slug,
  });

  if (isPending) {
    return <FullPageSpinner />;
  }

  if (!bookmark) {
    return (
      <FullPageError error="Bookmark not found" onRetry={() => refetch()} />
    );
  }

  const handleDeleteBookmark = () => {
    Alert.alert(
      "Delete bookmark?",
      "Are you sure you want to delete this bookmark?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: () => deleteBookmark({ bookmarkId: bookmark.id }),
          style: "destructive",
        },
      ],
    );
  };

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
    <KeyboardGestureArea interpolator="ios">
      <KeyboardAwareScrollView
        className="p-4"
        bottomOffset={8}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={{ paddingBottom: insets.bottom }}
      >
        <Stack.Screen
          options={{
            headerShown: true,
            headerTransparent: false,
            headerTitle: title ?? "Untitled",
            headerRight: () => (
              <Pressable
                onPress={() => {
                  if (router.canGoBack()) {
                    router.back();
                  } else {
                    router.replace("dashboard");
                  }
                }}
              >
                <Text>Done</Text>
              </Pressable>
            ),
          }}
        />
        <Form className="gap-4">
          <TitleEditor bookmarkId={bookmark.id} title={title ?? ""} />
          <TagList bookmark={bookmark} />
          <ManageLists bookmark={bookmark} />
          <NotesEditor bookmark={bookmark} />
          <FormSection>
            <FormItem>
              <Button
                variant="destructive"
                onPress={handleDeleteBookmark}
                disabled={isDeletionPending}
              >
                <Text>Delete</Text>
              </Button>
            </FormItem>
          </FormSection>
          <View className="gap-2">
            <Text className="items-center text-center">
              Created {bookmark.createdAt.toLocaleString()}
            </Text>
            {bookmark.modifiedAt &&
              bookmark.modifiedAt.getTime() !==
                bookmark.createdAt.getTime() && (
                <Text className="items-center text-center">
                  Modified {bookmark.modifiedAt.toLocaleString()}
                </Text>
              )}
          </View>
        </Form>
      </KeyboardAwareScrollView>
    </KeyboardGestureArea>
  );
};

export default ViewBookmarkPage;
