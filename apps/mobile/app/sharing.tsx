import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useShareIntentContext } from "expo-share-intent";
import { Button } from "@/components/ui/Button";
import useAppSettings from "@/lib/settings";
import { api } from "@/lib/trpc";
import { useUploadAsset } from "@/lib/upload";
import { z } from "zod";

import { BookmarkTypes, ZBookmark } from "@karakeep/shared/types/bookmarks";

type Mode =
  | { type: "idle" }
  | { type: "success"; bookmarkId: string }
  | { type: "alreadyExists"; bookmarkId: string }
  | { type: "error" };

function SaveBookmark({ setMode }: { setMode: (mode: Mode) => void }) {
  const { hasShareIntent, shareIntent, resetShareIntent } =
    useShareIntentContext();
  const { settings, isLoading } = useAppSettings();

  const onSaved = (d: ZBookmark & { alreadyExists: boolean }) => {
    invalidateAllBookmarks();
    setMode({
      type: d.alreadyExists ? "alreadyExists" : "success",
      bookmarkId: d.id,
    });
    // Reset share intent only after successful save
    if (hasShareIntent) {
      resetShareIntent();
    }
  };

  const onError = () => {
    setMode({ type: "error" });
    // Reset share intent on error to prevent stuck state
    if (hasShareIntent) {
      resetShareIntent();
    }
  };

  const { uploadAsset } = useUploadAsset(settings, {
    onSuccess: onSaved,
    onError: onError,
  });

  const invalidateAllBookmarks =
    api.useUtils().bookmarks.getBookmarks.invalidate;

  const { mutate, isPending } = api.bookmarks.createBookmark.useMutation({
    onSuccess: onSaved,
    onError: onError,
  });

  useEffect(() => {
    if (isLoading) {
      return;
    }

    // Add Android-specific debugging
    if (Platform.OS === "android" && __DEV__) {
      console.log("Android share intent data:", {
        hasShareIntent,
        webUrl: shareIntent?.webUrl,
        text: shareIntent?.text,
        files: shareIntent?.files?.length || 0,
      });
    }

    // Validate that we have actual share intent data before processing
    if (
      !shareIntent ||
      (!shareIntent.webUrl && !shareIntent.text && !shareIntent.files?.length)
    ) {
      if (Platform.OS === "android" && __DEV__) {
        console.log("No valid share intent data found, waiting...");
      }
      return;
    }

    if (!isPending && shareIntent.webUrl) {
      mutate({ type: BookmarkTypes.LINK, url: shareIntent.webUrl });
    } else if (!isPending && shareIntent.text) {
      const val = z.string().url();
      if (val.safeParse(shareIntent.text).success) {
        // This is a URL, else treated as text
        mutate({ type: BookmarkTypes.LINK, url: shareIntent.text });
      } else {
        mutate({ type: BookmarkTypes.TEXT, text: shareIntent.text });
      }
    } else if (
      !isPending &&
      shareIntent?.files &&
      shareIntent.files.length > 0
    ) {
      uploadAsset({
        type: shareIntent.files[0].mimeType,
        name: shareIntent.files[0].fileName ?? "",
        uri: shareIntent.files[0].path,
      });
    }
  }, [isLoading, shareIntent, isPending, mutate, uploadAsset, hasShareIntent]);

  return (
    <View className="flex flex-row gap-3">
      <Text className="text-4xl text-foreground">Saving</Text>
      <ActivityIndicator />
    </View>
  );
}

export default function Sharing() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>({ type: "idle" });

  const [autoCloseTimeoutId, setAutoCloseTimeoutId] =
    useState<NodeJS.Timeout | null>(null);

  let comp;
  switch (mode.type) {
    case "idle": {
      comp = <SaveBookmark setMode={setMode} />;
      break;
    }
    case "alreadyExists":
    case "success": {
      comp = (
        <View className="items-center gap-4">
          <Text className="text-4xl text-foreground">
            {mode.type === "alreadyExists" ? "Already Saved!" : "Saved!"}
          </Text>
          <Button
            label="Manage"
            onPress={() => {
              router.replace(`/dashboard/bookmarks/${mode.bookmarkId}/info`);
              if (autoCloseTimeoutId) {
                clearTimeout(autoCloseTimeoutId);
                setAutoCloseTimeoutId(null);
              }
            }}
          />
          <Pressable onPress={() => router.replace("dashboard")}>
            <Text className="text-muted-foreground">Dismiss</Text>
          </Pressable>
        </View>
      );
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

    setAutoCloseTimeoutId(timeoutId);

    return () => {
      clearTimeout(timeoutId);
      setAutoCloseTimeoutId(null);
    };
  }, [mode.type, router]);

  return (
    <View className="flex-1 items-center justify-center gap-4">{comp}</View>
  );
}
