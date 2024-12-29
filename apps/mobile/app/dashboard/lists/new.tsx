import React, { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { Button } from "@/components/ui/Button";
import CustomSafeAreaView from "@/components/ui/CustomSafeAreaView";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

import { useCreateBookmarkList } from "@hoarder/shared-react/hooks/lists";

const NewListPage = () => {
  const dismiss = () => {
    router.back();
  };
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
    <CustomSafeAreaView>
      <View className="gap-2 px-4">
        <View className="flex flex-row items-center gap-1">
          <Text className="shrink p-2">🚀</Text>
          <Input
            className="flex-1"
            onChangeText={setText}
            placeholder="List Name"
            autoFocus
            autoCapitalize={"none"}
          />
        </View>
        <Button disabled={isPending} onPress={onSubmit} label="Save" />
      </View>
    </CustomSafeAreaView>
  );
};

export default NewListPage;
