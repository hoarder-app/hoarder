import { useRouter } from "expo-router";
import { useState } from "react";
import { View, Text } from "react-native";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/trpc";

export default function AddNote() {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | undefined>();
  const router = useRouter();
  const invalidateAllBookmarks =
    api.useUtils().bookmarks.getBookmarks.invalidate;

  const { mutate } = api.bookmarks.createBookmark.useMutation({
    onSuccess: () => {
      invalidateAllBookmarks();
      if (router.canGoBack()) {
        router.replace("../");
      } else {
        router.replace("dashboard");
      }
    },
    onError: (e) => {
      let message;
      if (e.data?.code === "BAD_REQUEST") {
        const error = JSON.parse(e.message)[0];
        message = error.message;
      } else {
        message = `Something went wrong: ${e.message}`;
      }
      setError(message);
    },
  });

  return (
    <View className="flex gap-2 p-4">
      {error && (
        <Text className="w-full text-center text-red-500">{error}</Text>
      )}
      <Input
        className="bg-white"
        value={text}
        onChangeText={setText}
        multiline
        placeholder="What's on your mind?"
        autoFocus
      />
      <Button onPress={() => mutate({ type: "text", text })} label="Add Note" />
    </View>
  );
}
