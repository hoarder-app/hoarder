import { ZBookmark } from "@hoarder/trpc/types/bookmarks";
import { ZBookmarkTags } from "@hoarder/trpc/types/tags";
import { Star, Archive, Trash } from "lucide-react-native";
import { View, Text, Image, ScrollView, Pressable } from "react-native";
import Markdown from "react-native-markdown-display";

import { api } from "@/lib/trpc";

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

function TagList({ tags }: { tags: ZBookmarkTags[] }) {
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

  return (
    <View className="flex gap-2">
      <Image
        source={{ uri: bookmark.content.imageUrl || "" }}
        className="h-56 min-h-56 w-full"
      />
      <View className="flex gap-2">
        <Text className="line-clamp-2 text-xl font-bold">
          {bookmark.content.title || parsedUrl.host}
        </Text>
        <TagList tags={bookmark.tags} />
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
      <TagList tags={bookmark.tags} />
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
    { initialData },
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
