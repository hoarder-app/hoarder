import { Alert, Platform, View } from "react-native";
import * as Haptics from "expo-haptics";
import { router, Stack, useLocalSearchParams } from "expo-router";
import UpdatingBookmarkList from "@/components/bookmarks/UpdatingBookmarkList";
import FullPageError from "@/components/FullPageError";
import CustomSafeAreaView from "@/components/ui/CustomSafeAreaView";
import FullPageSpinner from "@/components/ui/FullPageSpinner";
import PageTitle from "@/components/ui/PageTitle";
import { api } from "@/lib/trpc";
import { MenuView } from "@react-native-menu/menu";
import { Ellipsis } from "lucide-react-native";

export default function ListView() {
  const { slug } = useLocalSearchParams();
  if (typeof slug !== "string") {
    throw new Error("Unexpected param type");
  }
  const {
    data: list,
    error,
    refetch,
  } = api.lists.get.useQuery({ listId: slug });

  return (
    <CustomSafeAreaView>
      <Stack.Screen
        options={{
          headerTitle: "",
          headerBackTitle: "Back",
          headerTransparent: true,
        }}
      />
      {error ? (
        <FullPageError error={error.message} onRetry={() => refetch()} />
      ) : list ? (
        <View>
          <UpdatingBookmarkList
            query={{
              listId: list.id,
            }}
            header={
              <View className="flex flex-row items-center justify-between">
                <PageTitle title={`${list.icon} ${list.name}`} />
                <ListActionsMenu listId={list.id} />
              </View>
            }
          />
        </View>
      ) : (
        <FullPageSpinner />
      )}
    </CustomSafeAreaView>
  );
}

function ListActionsMenu({ listId }: { listId: string }) {
  const { mutate } = api.lists.delete.useMutation({
    onSuccess: () => {
      router.replace("/dashboard/lists");
    },
  });

  const handleDelete = () => {
    Alert.alert("Delete List", "Are you sure you want to delete this list?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        onPress: () => {
          mutate({ listId });
        },
        style: "destructive",
      },
    ]);
  };

  return (
    <MenuView
      actions={[
        {
          id: "delete",
          title: "Delete List",
          attributes: {
            destructive: true,
          },
          image: Platform.select({
            ios: "trash",
          }),
        },
      ]}
      onPressAction={({ nativeEvent }) => {
        if (nativeEvent.event === "delete") {
          handleDelete();
        }
      }}
      shouldOpenOnLongPress={false}
    >
      <Ellipsis onPress={() => Haptics.selectionAsync()} color="gray" />
    </MenuView>
  );
}
