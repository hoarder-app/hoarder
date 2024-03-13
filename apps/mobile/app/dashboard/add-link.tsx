import { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
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
      if (e.data?.zodError) {
        const zodError = e.data.zodError;
        message = JSON.stringify(zodError);
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
        placeholder="Link"
        autoCapitalize="none"
        inputMode="url"
        autoFocus
      />
      <Button
        onPress={() => mutate({ type: "link", url: text })}
        label="Add Link"
      />
    </View>
  );
}
