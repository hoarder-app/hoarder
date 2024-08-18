import React from "react";
import { Pressable, Text, View } from "react-native";
import Checkbox from "expo-checkbox";
import {
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetModalProps,
} from "@gorhom/bottom-sheet";

import {
  useAddBookmarkToList,
  useBookmarkLists,
  useRemoveBookmarkFromList,
} from "@hoarder/shared-react/hooks/lists";
import { api } from "@hoarder/shared-react/trpc";

import PageTitle from "../ui/PageTitle";
import { useToast } from "../ui/Toast";

const ListPickerModal = React.forwardRef<
  BottomSheetModal,
  Omit<BottomSheetModalProps, "children"> & {
    bookmarkId: string;
  }
>(({ bookmarkId, ...props }, ref) => {
  const { toast } = useToast();
  const onError = () => {
    toast({
      message: "Something went wrong",
      variant: "destructive",
      showProgress: false,
    });
  };
  const { data: existingLists } = api.lists.getListsOfBookmark.useQuery(
    {
      bookmarkId,
    },
    {
      select: (data) => new Set(data.lists.map((l) => l.id)),
    },
  );
  const { data } = useBookmarkLists();

  const { mutate: addToList } = useAddBookmarkToList({
    onSuccess: () => {
      toast({
        message: `The bookmark has been added to the list!`,
        showProgress: false,
      });
    },
    onError,
  });

  const { mutate: removeToList } = useRemoveBookmarkFromList({
    onSuccess: () => {
      toast({
        message: `The bookmark has been removed from the list!`,
        showProgress: false,
      });
    },
    onError,
  });

  const toggleList = (listId: string) => {
    if (!existingLists) {
      return;
    }
    if (existingLists.has(listId)) {
      removeToList({ bookmarkId, listId });
    } else {
      addToList({ bookmarkId, listId });
    }
  };

  const { allPaths } = data ?? {};
  return (
    <View>
      <BottomSheetModal ref={ref} {...props}>
        <BottomSheetFlatList
          ListHeaderComponent={<PageTitle title="Manage Lists" />}
          className="h-full"
          contentContainerStyle={{
            gap: 5,
          }}
          renderItem={(l) => (
            <View className="mx-2 flex flex-row items-center rounded-xl border border-input bg-white px-4 py-2 dark:bg-accent">
              <Pressable
                key={l.item[l.item.length - 1].id}
                onPress={() => toggleList(l.item[l.item.length - 1].id)}
                className="flex w-full flex-row justify-between"
              >
                <Text className="text-lg text-accent-foreground">
                  {l.item
                    .map((item) => `${item.icon} ${item.name}`)
                    .join(" / ")}
                </Text>
                <Checkbox
                  value={
                    existingLists &&
                    existingLists.has(l.item[l.item.length - 1].id)
                  }
                  onValueChange={() => {
                    toggleList(l.item[l.item.length - 1].id);
                  }}
                />
              </Pressable>
            </View>
          )}
          data={allPaths}
        />
      </BottomSheetModal>
    </View>
  );
});
ListPickerModal.displayName = "ListPickerModal";

export default ListPickerModal;
