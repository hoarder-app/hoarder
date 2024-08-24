import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/trpc";

import {
  useCreateBookmark,
  useUpdateBookmarkText,
} from "@hoarder/shared-react/hooks/bookmarks";
import { BookmarkTypes } from "@hoarder/shared/types/bookmarks";

export default function AddNote() {
  const { bookmarkId } = useLocalSearchParams();
  if (bookmarkId && typeof bookmarkId !== "string") {
    throw new Error("Unexpected param type");
  }

  const isEditing = !!bookmarkId;

  const [text, setText] = useState("");
  const [error, setError] = useState<string | undefined>();
  const router = useRouter();

  const { data: bookmark } = api.bookmarks.getBookmark.useQuery(
    { bookmarkId: bookmarkId! },
    {
      enabled: !!bookmarkId,
    },
  );

  useEffect(() => {
    if (bookmark) {
      if (bookmark.content.type !== BookmarkTypes.TEXT) {
        throw new Error("Wrong content type rendered");
      }
      setText(bookmark.content.text);
    }
  }, [bookmark]);

  const onSuccess = () => {
    if (router.canGoBack()) {
      router.replace("./");
    } else {
      router.replace("dashboard");
    }
  };

  const { mutate: createBookmark } = useCreateBookmark({
    onSuccess,
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

  const { mutate: updateBookmark } = useUpdateBookmarkText({
    onSuccess,
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

  const mutate = (text: string) => {
    if (isEditing) {
      updateBookmark({
        bookmarkId,
        text,
      });
    } else {
      createBookmark({ type: BookmarkTypes.TEXT, text });
    }
  };

  return (
    <View className="flex gap-2 p-4">
      <Stack.Screen
        options={{
          title: isEditing ? "Edit Note" : "Add Note",
        }}
      />
      {error && (
        <Text className="w-full text-center text-red-500">{error}</Text>
      )}
      <Input
        value={text}
        onChangeText={setText}
        multiline
        numberOfLines={8}
        placeholder="What's on your mind?"
        autoFocus
        textAlignVertical="top"
      />
      <Button
        onPress={() => mutate(text)}
        label={isEditing ? "Save" : "Add Note"}
      />
    </View>
  );
}
