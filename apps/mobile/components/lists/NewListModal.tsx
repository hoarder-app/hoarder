import React, { useState } from "react";
import { Text, View } from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProps,
  BottomSheetView,
  useBottomSheetModal,
} from "@gorhom/bottom-sheet";

import { useCreateBookmarkList } from "@hoarder/shared-react/hooks/lists";

import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import PageTitle from "../ui/PageTitle";
import { useToast } from "../ui/Toast";

const NewListModal = React.forwardRef<
  BottomSheetModal,
  Omit<BottomSheetModalProps, "children" | "backdropComponent" | "onDismiss">
>(({ ...props }, ref) => {
  const { dismiss } = useBottomSheetModal();
  const { toast } = useToast();
  const [text, setText] = useState("");

  const { mutate, isPending } = useCreateBookmarkList({
    onSuccess: () => {
      dismiss();
    },
    onError: () => {
      toast({
        message: "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const onSubmit = () => {
    mutate({
      name: text,
      icon: "🚀",
    });
  };

  return (
    <View>
      <BottomSheetModal
        ref={ref}
        onDismiss={() => setText("")}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            {...props}
          />
        )}
        {...props}
      >
        <PageTitle title="New List" />
        <BottomSheetView className="gap-2 px-4">
          <BottomSheetView className="flex flex-row items-center gap-1">
            <Text className="shrink p-2">🚀</Text>
            <Input
              className="flex-1"
              onChangeText={setText}
              placeholder="List Name"
              autoFocus
              autoCapitalize={"none"}
            />
          </BottomSheetView>
          <Button disabled={isPending} onPress={onSubmit} label="Save" />
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
});

NewListModal.displayName = "NewListModal";

export default NewListModal;
