import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import Markdown from "react-native-markdown-display";
import * as Haptics from "expo-haptics";
import { Link } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import useAppSettings from "@/lib/settings";
import { api } from "@/lib/trpc";
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

import { TailwindResolver } from "../TailwindResolver";
import { Divider } from "../ui/Divider";
import { Skeleton } from "../ui/Skeleton";
import { useToast } from "../ui/Toast";

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
          <View
            key={t.id}
            className="rounded-full border border-accent px-2.5 py-0.5 text-xs font-semibold"
          >
            <Link className="text-foreground" href={`dashboard/tags/${t.id}`}>
              {t.name}
            </Link>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function LinkCard({ bookmark }: { bookmark: ZBookmark }) {
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
      {imageComp}
      <View className="flex gap-2 p-2">
        <Text
          className="line-clamp-2 text-xl font-bold text-foreground"
          onPress={() => WebBrowser.openBrowserAsync(url)}
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

function TextCard({ bookmark }: { bookmark: ZBookmark }) {
  if (bookmark.content.type !== BookmarkTypes.TEXT) {
    throw new Error("Wrong content type rendered");
  }
  const content = bookmark.content.text;
  return (
    <View className="flex max-h-96 gap-2 p-2">
      {bookmark.title && (
        <Text className="line-clamp-2 text-xl font-bold text-foreground">
          {bookmark.title}
        </Text>
      )}
      <View className="max-h-56 overflow-hidden p-2 text-foreground">
        <TailwindResolver
          className="text-foreground"
          comp={(styles) => (
            <Markdown
              style={{
                text: {
                  color: styles?.color?.toString(),
                },
              }}
            >
              {content}
            </Markdown>
          )}
        />
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

function AssetCard({ bookmark }: { bookmark: ZBookmark }) {
  const { settings } = useAppSettings();
  if (bookmark.content.type !== BookmarkTypes.ASSET) {
    throw new Error("Wrong content type rendered");
  }
  const title = bookmark.title ?? bookmark.content.fileName;

  return (
    <View className="flex gap-2">
      <Image
        source={{
          uri: `${settings.address}/api/assets/${bookmark.content.assetId}`,
          headers: {
            Authorization: `Bearer ${settings.apiKey}`,
          },
        }}
        className="h-56 min-h-56 w-full object-cover"
      />
      <View className="flex gap-2 p-2">
        {title && (
          <Text className="line-clamp-2 text-xl font-bold text-foreground">
            {title}
          </Text>
        )}
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

  let comp;
  switch (bookmark.content.type) {
    case BookmarkTypes.LINK:
      comp = <LinkCard bookmark={bookmark} />;
      break;
    case BookmarkTypes.TEXT:
      comp = <TextCard bookmark={bookmark} />;
      break;
    case BookmarkTypes.ASSET:
      comp = <AssetCard bookmark={bookmark} />;
      break;
  }

  return (
    <View className="overflow-hidden rounded-xl border-b border-accent bg-background">
      {comp}
    </View>
  );
}
