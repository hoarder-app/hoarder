import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProps,
  BottomSheetTextInput,
  BottomSheetView,
  useBottomSheetModal,
} from "@gorhom/bottom-sheet";

import {
  useCreateBookmark,
  useUpdateBookmarkText,
} from "@hoarder/shared-react/hooks/bookmarks";
import { BookmarkTypes, ZBookmark } from "@hoarder/shared/types/bookmarks";

import { Button } from "../ui/Button";
import PageTitle from "../ui/PageTitle";

const NoteEditorModal = React.forwardRef<
  BottomSheetModal,
  Omit<
    BottomSheetModalProps,
    "children" | "backdropComponent" | "onDismiss"
  > & {
    bookmark?: ZBookmark;
  }
>(({ bookmark, ...props }, ref) => {
  const { dismiss } = useBottomSheetModal();
  const isEditing = !!bookmark;

  const [text, setText] = useState("");
  const [error, setError] = useState<string | undefined>();

  const resetText = () => {
    if (bookmark) {
      if (bookmark.content.type !== BookmarkTypes.TEXT) {
        throw new Error("Wrong content type rendered");
      }
      setText(bookmark.content.text);
    }
  };

  useEffect(resetText, []);

  const onSuccess = () => {
    resetText();
    dismiss();
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
        bookmarkId: bookmark.id,
        text,
      });
    } else {
      createBookmark({ type: BookmarkTypes.TEXT, text });
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
        <PageTitle title={isEditing ? "Edit Note" : "New Note"} />
        <BottomSheetView className="p-4">
          {error && (
            <Text className="w-full text-center text-red-500">{error}</Text>
          )}
          <BottomSheetTextInput
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
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
});
NoteEditorModal.displayName = "NewBookmarkModal";

export default NoteEditorModal;
