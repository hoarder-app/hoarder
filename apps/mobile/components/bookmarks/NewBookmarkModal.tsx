import React, { useState } from "react";
import { Text, View } from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProps,
  BottomSheetView,
  useBottomSheetModal,
} from "@gorhom/bottom-sheet";

import { useCreateBookmark } from "@hoarder/shared-react/hooks/bookmarks";
import { BookmarkTypes } from "@hoarder/shared/types/bookmarks";

import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import PageTitle from "../ui/PageTitle";
import { useToast } from "../ui/Toast";

const NoteEditorModal = React.forwardRef<
  BottomSheetModal,
  Omit<BottomSheetModalProps, "children" | "backdropComponent" | "onDismiss">
>(({ ...props }, ref) => {
  const { dismiss } = useBottomSheetModal();

  const [text, setText] = useState("");
  const [error, setError] = useState<string | undefined>();
  const { toast } = useToast();

  const { mutate: createBookmark } = useCreateBookmark({
    onSuccess: (resp) => {
      if (resp.alreadyExists) {
        toast({
          message: "Bookmark already exists",
        });
      }
      setText("");
      dismiss();
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

  const onSubmit = () => {
    const data = text.trim();
    try {
      const url = new URL(data);
      if (url.protocol != "http:" && url.protocol != "https:") {
        throw new Error(`Unsupported URL protocol: ${url.protocol}`);
      }
      createBookmark({ type: BookmarkTypes.LINK, url: data });
    } catch (e: unknown) {
      createBookmark({ type: BookmarkTypes.TEXT, text: data });
    }
  };

  return (
    <View>
      <BottomSheetModal
        ref={ref}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            {...props}
          />
        )}
        {...props}
      >
        <PageTitle title="New Bookmark" />
        <BottomSheetView className="gap-2 p-4">
          {error && (
            <Text className="w-full text-center text-red-500">{error}</Text>
          )}
          <Input
            onChangeText={setText}
            multiline
            placeholder="What's on your mind?"
            autoFocus
            autoCapitalize={"none"}
            textAlignVertical="top"
          />
          <Button onPress={onSubmit} label="Save" />
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
});
NoteEditorModal.displayName = "NewBookmarkModal";

export default NoteEditorModal;
