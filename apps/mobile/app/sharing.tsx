import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useShareIntentContext } from "expo-share-intent";
import useAppSettings from "@/lib/settings";
import { api } from "@/lib/trpc";
import { useUploadAsset } from "@/lib/upload";
import { z } from "zod";

import { BookmarkTypes, ZBookmark } from "@hoarder/shared/types/bookmarks";

type Mode =
  | { type: "idle" }
  | { type: "success"; bookmarkId: string }
  | { type: "alreadyExists"; bookmarkId: string }
  | { type: "error" };

function SaveBookmark({ setMode }: { setMode: (mode: Mode) => void }) {
  const onSaved = (d: ZBookmark & { alreadyExists: boolean }) => {
    invalidateAllBookmarks();
    setMode({
      type: d.alreadyExists ? "alreadyExists" : "success",
      bookmarkId: d.id,
    });
  };

  const { hasShareIntent, shareIntent, resetShareIntent } =
    useShareIntentContext();
  const { settings, isLoading } = useAppSettings();
  const { uploadAsset } = useUploadAsset(settings, {
    onSuccess: onSaved,
    onError: () => {
      setMode({ type: "error" });
    },
  });

  const invalidateAllBookmarks =
    api.useUtils().bookmarks.getBookmarks.invalidate;

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!isPending && shareIntent?.text) {
      const val = z.string().url();
      if (val.safeParse(shareIntent.text).success) {
        // This is a URL, else treated as text
        mutate({ type: BookmarkTypes.LINK, url: shareIntent.text });
      } else {
        mutate({ type: BookmarkTypes.TEXT, text: shareIntent.text });
      }
    } else if (!isPending && shareIntent?.files) {
      uploadAsset({
        type: shareIntent.files[0].type,
        name: shareIntent.files[0].fileName ?? "",
        uri: shareIntent.files[0].path,
      });
    }
    if (hasShareIntent) {
      resetShareIntent();
    }
  }, [isLoading]);

  const { mutate, isPending } = api.bookmarks.createBookmark.useMutation({
    onSuccess: onSaved,
    onError: () => {
      setMode({ type: "error" });
    },
  });

  return (
    <View className="flex flex-row gap-3">
      <Text className="text-4xl text-foreground">Hoarding</Text>
      <ActivityIndicator />
    </View>
  );
}

export default function Sharing() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>({ type: "idle" });

  let comp;
  switch (mode.type) {
    case "idle": {
      comp = <SaveBookmark setMode={setMode} />;
      break;
    }
    case "success": {
      comp = <Text className="text-4xl text-foreground">Hoarded!</Text>;
      break;
    }
    case "alreadyExists": {
      comp = <Text className="text-4xl text-foreground">Already Hoarded!</Text>;
      break;
    }
    case "error": {
      comp = <Text className="text-4xl text-foreground">Error!</Text>;
      break;
    }
  }

  // Auto dismiss the modal after saving.
  useEffect(() => {
    if (mode.type === "idle") {
      return;
    }

    const timeoutId = setTimeout(() => {
      router.replace("dashboard");
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [mode.type]);

  return (
    <View className="flex-1 items-center justify-center gap-4">{comp}</View>
  );
}
