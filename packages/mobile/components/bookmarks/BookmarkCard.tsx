import { ZBookmark } from "@hoarder/trpc/types/bookmarks";
import { Star, Archive, Trash } from "lucide-react-native";
import { View, Text, Image, ScrollView, Pressable } from "react-native";
import Markdown from "react-native-markdown-display";

import { Skeleton } from "../ui/Skeleton";

import { api } from "@/lib/trpc";

const MAX_LOADING_MSEC = 30 * 1000;

export function isBookmarkStillCrawling(bookmark: ZBookmark) {
  return (
    bookmark.content.type === "link" &&
    !bookmark.content.crawledAt &&
    Date.now().valueOf() - bookmark.createdAt.valueOf() < MAX_LOADING_MSEC
  );
}

export function isBookmarkStillTagging(bookmark: ZBookmark) {
  return (
    bookmark.taggingStatus === "pending" &&
    Date.now().valueOf() - bookmark.createdAt.valueOf() < MAX_LOADING_MSEC
  );
}

export function isBookmarkStillLoading(bookmark: ZBookmark) {
  return isBookmarkStillTagging(bookmark) || isBookmarkStillCrawling(bookmark);
}

function ActionBar({ bookmark }: { bookmark: ZBookmark }) {
  const apiUtils = api.useUtils();

  const { mutate: deleteBookmark } = api.bookmarks.deleteBookmark.useMutation({
    onSuccess: () => {
      apiUtils.bookmarks.getBookmarks.invalidate();
    },
  });
  const { mutate: updateBookmark, variables } =
    api.bookmarks.updateBookmark.useMutation({
      onSuccess: () => {
        apiUtils.bookmarks.getBookmarks.invalidate();
        apiUtils.bookmarks.getBookmark.invalidate({ bookmarkId: bookmark.id });
      },
    });

  return (
    <View className="flex flex-row gap-4">
      <Pressable
        onPress={() =>
          updateBookmark({
            bookmarkId: bookmark.id,
            favourited: !bookmark.favourited,
          })
        }
      >
        {(variables ? variables.favourited : bookmark.favourited) ? (
          <Star fill="#ebb434" color="#ebb434" />
        ) : (
          <Star />
        )}
      </Pressable>
      <Pressable
        onPress={() =>
          updateBookmark({
            bookmarkId: bookmark.id,
            archived: !bookmark.archived,
          })
        }
      >
        <Archive />
      </Pressable>
      <Pressable
        onPress={() =>
          deleteBookmark({
            bookmarkId: bookmark.id,
          })
        }
      >
        <Trash />
      </Pressable>
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
            className="rounded-full border border-gray-200 px-2.5 py-0.5 text-xs font-semibold"
          >
            <Text>{t.name}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function LinkCard({ bookmark }: { bookmark: ZBookmark }) {
  if (bookmark.content.type !== "link") {
    throw new Error("Wrong content type rendered");
  }

  const parsedUrl = new URL(bookmark.content.url);

  const imageComp = bookmark.content.imageUrl ? (
    <Image
      source={{ uri: bookmark.content.imageUrl }}
      className="h-56 min-h-56 w-full"
    />
  ) : (
    <Image source={require("@/assets/blur.jpeg")} className="h-56 w-full" />
  );

  return (
    <View className="flex gap-2">
      {imageComp}
      <View className="flex gap-2">
        <Text className="line-clamp-2 text-xl font-bold">
          {bookmark.content.title || parsedUrl.host}
        </Text>
        <TagList bookmark={bookmark} />
        <View className="mt-2 flex flex-row justify-between">
          <Text className="my-auto line-clamp-1">{parsedUrl.host}</Text>
          <ActionBar bookmark={bookmark} />
        </View>
      </View>
    </View>
  );
}

function TextCard({ bookmark }: { bookmark: ZBookmark }) {
  if (bookmark.content.type !== "text") {
    throw new Error("Wrong content type rendered");
  }
  return (
    <View className="flex max-h-96 gap-2">
      <View className="max-h-56 overflow-hidden pb-2">
        <Markdown>{bookmark.content.text}</Markdown>
      </View>
      <TagList bookmark={bookmark} />
      <View className="flex flex-row justify-between">
        <View />
        <ActionBar bookmark={bookmark} />
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
    case "link":
      comp = <LinkCard bookmark={bookmark} />;
      break;
    case "text":
      comp = <TextCard bookmark={bookmark} />;
      break;
  }

  return <View className="rounded bg-white p-4">{comp}</View>;
}
