import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { ShareIntent } from "expo-share-intent";
import { useEffect, useMemo, useState } from "react";
import { View, Text } from "react-native";

import { api } from "@/lib/trpc";

type Mode =
  | { type: "idle" }
  | { type: "success"; bookmarkId: string }
  | { type: "error" };

function SaveBookmark({ setMode }: { setMode: (mode: Mode) => void }) {
  const params = useLocalSearchParams();

  const shareIntent = useMemo(() => {
    if (params && params.shareIntent) {
      if (typeof params.shareIntent === "string") {
        return JSON.parse(params.shareIntent) as ShareIntent;
      }
    }
    return null;
  }, [params]);

  useEffect(() => {
    if (!isPending && shareIntent?.text) {
      mutate({ type: "link", url: shareIntent.text });
    }
  }, []);

  const { mutate, isPending } = api.bookmarks.createBookmark.useMutation({
    onSuccess: (d) => {
      setMode({ type: "success", bookmarkId: d.id });
    },
    onError: () => {
      setMode({ type: "error" });
    },
  });

  return <Text className="text-4xl">Hoarding ...</Text>;
}

export default function Sharing() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>({ type: "idle" });

  const isInModal = router.canGoBack();

  let comp;
  switch (mode.type) {
    case "idle": {
      comp = <SaveBookmark setMode={setMode} />;
      break;
    }
    case "success": {
      comp = <Text className="text-4xl">Hoarded!</Text>;
      break;
    }
    case "error": {
      comp = <Text className="text-4xl">Error!</Text>;
      break;
    }
  }

  // Auto dismiss the modal after saving.
  useEffect(() => {
    if (mode.type === "idle") {
      return;
    }

    if (!isInModal) {
      return;
    }

    const timeoutId = setTimeout(() => {
      router.replace("../");
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [mode.type]);

  return (
    <View className="flex-1 items-center justify-center gap-4">
      {comp}
      {isInModal ? <Link href="../">Dismiss</Link> : <Link href="/">Home</Link>}
    </View>
  );
}
