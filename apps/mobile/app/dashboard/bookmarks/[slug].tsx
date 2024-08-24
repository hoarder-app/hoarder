import { View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import BookmarkAssetImage from "@/components/bookmarks/BookmarkAssetImage";
import BookmarkTextMarkdown from "@/components/bookmarks/BookmarkTextMarkdown";
import CustomSafeAreaView from "@/components/ui/CustomSafeAreaView";
import FullPageSpinner from "@/components/ui/FullPageSpinner";
import PageTitle from "@/components/ui/PageTitle";
import { api } from "@/lib/trpc";

import { BookmarkTypes, ZBookmark } from "@hoarder/shared/types/bookmarks";

function BookmarkTextView({ bookmark }: { bookmark: ZBookmark }) {
  if (bookmark.content.type !== BookmarkTypes.TEXT) {
    throw new Error("Wrong content type rendered");
  }
  const content = bookmark.content.text;

  return (
    <View className="flex gap-2">
      <BookmarkTextMarkdown text={content} />
    </View>
  );
}

function BookmarkAssetView({ bookmark }: { bookmark: ZBookmark }) {
  if (bookmark.content.type !== BookmarkTypes.ASSET) {
    throw new Error("Wrong content type rendered");
  }
  return (
    <View className="flex gap-2">
      <BookmarkAssetImage
        assetId={bookmark.content.assetId}
        className="h-56 min-h-56 w-full object-cover"
      />
    </View>
  );
}

export default function BookmarkView() {
  const { slug } = useLocalSearchParams();
  if (typeof slug !== "string") {
    throw new Error("Unexpected param type");
  }

  const { data: bookmark } = api.bookmarks.getBookmark.useQuery({
    bookmarkId: slug,
  });

  let comp;
  let title = null;
  if (bookmark) {
    switch (bookmark.content.type) {
      case BookmarkTypes.LINK:
        comp = null;
        break;
      case BookmarkTypes.TEXT:
        title = bookmark.title;
        comp = <BookmarkTextView bookmark={bookmark} />;
        break;
      case BookmarkTypes.ASSET:
        title = bookmark.title ?? bookmark.content.fileName;
        comp = <BookmarkAssetView bookmark={bookmark} />;
        break;
    }
  } else {
    comp = <FullPageSpinner />;
  }

  return (
    <CustomSafeAreaView>
      <Stack.Screen
        options={{
          headerTitle: "",
          headerBackTitle: "Back",
          headerTransparent: true,
        }}
      />
      <PageTitle title={title ?? "Untitled"} />
      <View className="px-4 py-2">{comp}</View>
    </CustomSafeAreaView>
  );
}
