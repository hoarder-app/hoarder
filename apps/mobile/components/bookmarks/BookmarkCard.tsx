import { useRef } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import useAppSettings from "@/lib/settings";
import { api } from "@/lib/trpc";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { MenuView } from "@react-native-menu/menu";
import { Ellipsis, Star } from "lucide-react-native";

import type { ZBookmark } from "@hoarder/shared/types/bookmarks";
import {
  useDeleteBookmark,
  useUpdateBookmark,
} from "@hoarder/shared-react/hooks/bookmarks";
import {
  getBookmarkLinkImageUrl,
  isBookmarkStillLoading,
  isBookmarkStillTagging,
} from "@hoarder/shared-react/utils/bookmarkUtils";
import { BookmarkTypes } from "@hoarder/shared/types/bookmarks";

import { Divider } from "../ui/Divider";
import { Skeleton } from "../ui/Skeleton";
import { useToast } from "../ui/Toast";
import BookmarkAssetImage from "./BookmarkAssetImage";
import BookmarkTextMarkdown from "./BookmarkTextMarkdown";
import ListPickerModal from "./ListPickerModal";
import TagPill from "./TagPill";

function ActionBar({ bookmark }: { bookmark: ZBookmark }) {
  const { toast } = useToast();

  const onError = () => {
    toast({
      message: "Something went wrong",
      variant: "destructive",
      showProgress: false,
    });
  };

  const { mutate: deleteBookmark, isPending: isDeletionPending } =
    useDeleteBookmark({
      onSuccess: () => {
        toast({
          message: "The bookmark has been deleted!",
          showProgress: false,
        });
      },
      onError,
    });

  const { mutate: favouriteBookmark, variables } = useUpdateBookmark({
    onError,
  });

  const { mutate: archiveBookmark, isPending: isArchivePending } =
    useUpdateBookmark({
      onSuccess: (resp) => {
        toast({
          message: `The bookmark has been ${resp.archived ? "archived" : "un-archived"}!`,
          showProgress: false,
        });
      },
      onError,
    });

  const manageListsSheetRef = useRef<BottomSheetModal>(null);

  return (
    <View className="flex flex-row gap-4">
      {(isArchivePending || isDeletionPending) && <ActivityIndicator />}
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          favouriteBookmark({
            bookmarkId: bookmark.id,
            favourited: !bookmark.favourited,
          });
        }}
      >
        {(variables ? variables.favourited : bookmark.favourited) ? (
          <Star fill="#ebb434" color="#ebb434" />
        ) : (
          <Star color="gray" />
        )}
      </Pressable>

      <ListPickerModal
        ref={manageListsSheetRef}
        snapPoints={["50%", "90%"]}
        bookmarkId={bookmark.id}
      />

      <MenuView
        onPressAction={({ nativeEvent }) => {
          Haptics.selectionAsync();
          if (nativeEvent.event === "delete") {
            deleteBookmark({
              bookmarkId: bookmark.id,
            });
          } else if (nativeEvent.event === "archive") {
            archiveBookmark({
              bookmarkId: bookmark.id,
              archived: !bookmark.archived,
            });
          } else if (nativeEvent.event === "manage_list") {
            manageListsSheetRef?.current?.present();
          }
        }}
        actions={[
          {
            id: "archive",
            title: bookmark.archived ? "Un-archive" : "Archive",
            image: Platform.select({
              ios: "folder",
            }),
          },
          {
            id: "delete",
            title: "Delete",
            attributes: {
              destructive: true,
            },
            image: Platform.select({
              ios: "trash",
            }),
          },
          {
            id: "manage_list",
            title: "Manage Lists",
            image: Platform.select({
              ios: "list",
            }),
          },
        ]}
        shouldOpenOnLongPress={false}
      >
        <Ellipsis onPress={() => Haptics.selectionAsync()} color="gray" />
      </MenuView>
    </View>
  );
}

function TagList({ bookmark }: { bookmark: ZBookmark }) {
  const tags = bookmark.tags;

  if (isBookmarkStillTagging(bookmark)) {
    return (
      <>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View className="flex flex-row gap-2">
        {tags.map((t) => (
          <TagPill key={t.id} tag={t} />
        ))}
      </View>
    </ScrollView>
  );
}

function LinkCard({
  bookmark,
  onOpenBookmark,
}: {
  bookmark: ZBookmark;
  onOpenBookmark: () => void;
}) {
  const { settings } = useAppSettings();
  if (bookmark.content.type !== BookmarkTypes.LINK) {
    throw new Error("Wrong content type rendered");
  }

  const url = bookmark.content.url;
  const parsedUrl = new URL(url);

  const imageUrl = getBookmarkLinkImageUrl(bookmark.content);

  let imageComp;
  if (imageUrl) {
    imageComp = (
      <Image
        source={
          imageUrl.localAsset
            ? {
                uri: `${settings.address}${imageUrl.url}`,
                headers: {
                  Authorization: `Bearer ${settings.apiKey}`,
                },
              }
            : {
                uri: imageUrl.url,
              }
        }
        className="h-56 min-h-56 w-full object-cover"
      />
    );
  } else {
    imageComp = (
      <Image
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        source={require("@/assets/blur.jpeg")}
        className="h-56 w-full rounded-t-lg"
      />
    );
  }

  return (
    <View className="flex gap-2">
      <Pressable onPress={onOpenBookmark}>{imageComp}</Pressable>
      <View className="flex gap-2 p-2">
        <Text
          className="line-clamp-2 text-xl font-bold text-foreground"
          onPress={onOpenBookmark}
        >
          {bookmark.title ?? bookmark.content.title ?? parsedUrl.host}
        </Text>
        <TagList bookmark={bookmark} />
        <Divider orientation="vertical" className="mt-2 h-0.5 w-full" />
        <View className="mt-2 flex flex-row justify-between px-2 pb-2">
          <Text className="my-auto line-clamp-1 text-foreground">
            {parsedUrl.host}
          </Text>
          <ActionBar bookmark={bookmark} />
        </View>
      </View>
    </View>
  );
}

function TextCard({
  bookmark,
  onOpenBookmark,
}: {
  bookmark: ZBookmark;
  onOpenBookmark: () => void;
}) {
  if (bookmark.content.type !== BookmarkTypes.TEXT) {
    throw new Error("Wrong content type rendered");
  }
  const content = bookmark.content.text;
  return (
    <View className="flex max-h-96 gap-2 p-2">
      <Pressable onPress={onOpenBookmark}>
        {bookmark.title && (
          <Text className="line-clamp-2 text-xl font-bold text-foreground">
            {bookmark.title}
          </Text>
        )}
      </Pressable>
      <View className="max-h-56 overflow-hidden p-2 text-foreground">
        <Pressable onPress={onOpenBookmark}>
          <BookmarkTextMarkdown text={content} />
        </Pressable>
      </View>
      <TagList bookmark={bookmark} />
      <Divider orientation="vertical" className="mt-2 h-0.5 w-full" />
      <View className="flex flex-row justify-between p-2">
        <View />
        <ActionBar bookmark={bookmark} />
      </View>
    </View>
  );
}

function AssetCard({
  bookmark,
  onOpenBookmark,
}: {
  bookmark: ZBookmark;
  onOpenBookmark: () => void;
}) {
  if (bookmark.content.type !== BookmarkTypes.ASSET) {
    throw new Error("Wrong content type rendered");
  }
  const title = bookmark.title ?? bookmark.content.fileName;

  return (
    <View className="flex gap-2">
      <Pressable onPress={onOpenBookmark}>
        <BookmarkAssetImage
          assetId={bookmark.content.assetId}
          className="h-56 min-h-56 w-full object-cover"
        />
      </Pressable>
      <View className="flex gap-2 p-2">
        <Pressable onPress={onOpenBookmark}>
          {title && (
            <Text className="line-clamp-2 text-xl font-bold text-foreground">
              {title}
            </Text>
          )}
        </Pressable>
        <TagList bookmark={bookmark} />
        <Divider orientation="vertical" className="mt-2 h-0.5 w-full" />
        <View className="mt-2 flex flex-row justify-between px-2 pb-2">
          <View />
          <ActionBar bookmark={bookmark} />
        </View>
      </View>
    </View>
  );
}

export default function BookmarkCard({
  bookmark: initialData,
}: {
  bookmark: ZBookmark;
}) {
  const { data: bookmark } = api.bookmarks.getBookmark.useQuery(
    {
      bookmarkId: initialData.id,
    },
    {
      initialData,
      refetchInterval: (query) => {
        const data = query.state.data;
        if (!data) {
          return false;
        }
        // If the link is not crawled or not tagged
        if (isBookmarkStillLoading(data)) {
          return 1000;
        }
        return false;
      },
    },
  );

  const router = useRouter();

  let comp;
  switch (bookmark.content.type) {
    case BookmarkTypes.LINK:
      comp = (
        <LinkCard
          bookmark={bookmark}
          onOpenBookmark={() =>
            router.push(`/dashboard/bookmarks/${bookmark.id}`)
          }
        />
      );
      break;
    case BookmarkTypes.TEXT:
      comp = (
        <TextCard
          bookmark={bookmark}
          onOpenBookmark={() =>
            router.push(`/dashboard/bookmarks/${bookmark.id}`)
          }
        />
      );
      break;
    case BookmarkTypes.ASSET:
      comp = (
        <AssetCard
          bookmark={bookmark}
          onOpenBookmark={() =>
            router.push(`/dashboard/bookmarks/${bookmark.id}`)
          }
        />
      );
      break;
  }

  return (
    <View className="overflow-hidden rounded-xl border-b border-accent bg-background">
      {comp}
    </View>
  );
}
