import { useLocalSearchParams, useRouter } from "expo-router";
import { ShareIntent } from "expo-share-intent";
import { useEffect, useMemo } from "react";
import { View, Text } from "react-native";

import { api } from "@/lib/trpc";

export default function Sharing() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const shareIntent = useMemo(() => {
    if (params && params.shareIntent) {
      if (typeof params.shareIntent === "string") {
        return JSON.parse(params.shareIntent) as ShareIntent;
      }
    }
    return null;
  }, [params]);

  const { mutate, isPending } = api.bookmarks.createBookmark.useMutation({
    onSuccess: (d) => {
      router.replace(`bookmark/${d.id}`);
    },
    onError: () => {
      router.replace("error");
    },
  });

  useEffect(() => {
    if (!isPending && shareIntent?.text) {
      mutate({ type: "link", url: shareIntent.text });
    }
  }, []);

  useEffect(() => {
    if (!shareIntent) {
      router.replace("/");
    }
  }, []);

  return (
    <View className="flex-1 items-center justify-center gap-4">
      <Text className="text-4xl">Hoarding ...</Text>
    </View>
  );
}
