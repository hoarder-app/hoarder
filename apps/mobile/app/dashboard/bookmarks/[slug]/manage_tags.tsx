import React, { useMemo } from "react";
import { Pressable, SectionList, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { TailwindResolver } from "@/components/TailwindResolver";
import CustomSafeAreaView from "@/components/ui/CustomSafeAreaView";
import FullPageSpinner from "@/components/ui/FullPageSpinner";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { Check } from "lucide-react-native";

import { useUpdateBookmarkTags } from "@hoarder/shared-react/hooks/bookmarks";
import { api } from "@hoarder/shared-react/trpc";

const ListPickerPage = () => {
  const { slug: bookmarkId } = useLocalSearchParams();

  const [search, setSearch] = React.useState("");

  if (typeof bookmarkId !== "string") {
    throw new Error("Unexpected param type");
  }
  const { toast } = useToast();
  const onError = () => {
    toast({
      message: "Something went wrong",
      variant: "destructive",
      showProgress: false,
    });
  };
  const { data: allTags, isPending: isAllTagsPending } =
    api.tags.list.useQuery();
  const { data: existingTags } = api.bookmarks.getBookmark.useQuery(
    {
      bookmarkId,
    },
    {
      select: (data) => data.tags.map((t) => ({ id: t.id, name: t.name })),
    },
  );

  const [optimisticTags, setOptimisticTags] = React.useState(
    existingTags ?? [],
  );

  const { mutate: updateTags } = useUpdateBookmarkTags({
    onMutate: (req) => {
      req.attach.forEach((t) =>
        setOptimisticTags((prev) => [
          ...prev,
          { id: t.tagId!, name: t.tagName! },
        ]),
      );
      req.detach.forEach((t) =>
        setOptimisticTags((prev) => prev.filter((p) => p.id != t.tagId!)),
      );
    },
    onError,
  });

  const optimisticExistingTagIds = useMemo(() => {
    return new Set(optimisticTags?.map((t) => t.id) ?? []);
  }, [optimisticTags]);

  const filteredTags = useMemo(() => {
    return allTags?.tags.filter(
      (t) =>
        t.name.toLowerCase().startsWith(search.toLowerCase()) &&
        !optimisticExistingTagIds.has(t.id),
    );
  }, [search, allTags, optimisticExistingTagIds]);

  if (isAllTagsPending) {
    return <FullPageSpinner />;
  }

  return (
    <CustomSafeAreaView>
      <View className="px-3">
        <SectionList
          className="h-full"
          ListHeaderComponent={
            <Input
              placeholder="Search Tags ..."
              autoCapitalize="none"
              onChangeText={setSearch}
            />
          }
          keyExtractor={(t) => t.id}
          contentContainerStyle={{
            gap: 5,
          }}
          SectionSeparatorComponent={() => <View className="h-1" />}
          sections={[
            {
              title: "Existing Tags",
              data: optimisticTags ?? [],
            },
            {
              title: "All Tags",
              data: filteredTags ?? [],
            },
          ]}
          renderItem={(t) => (
            <Pressable
              key={t.item.id}
              onPress={() =>
                updateTags({
                  bookmarkId,
                  detach:
                    t.section.title == "Existing Tags"
                      ? [{ tagId: t.item.id, tagName: t.item.name }]
                      : [],
                  attach:
                    t.section.title == "All Tags"
                      ? [{ tagId: t.item.id, tagName: t.item.name }]
                      : [],
                })
              }
            >
              <View className="mx-2 flex flex-row items-center gap-2 rounded-xl border border-input bg-white px-4 py-2 dark:bg-accent">
                {t.section.title == "Existing Tags" && (
                  <TailwindResolver
                    className="text-accent-foreground"
                    comp={(s) => <Check color={s?.color} />}
                  />
                )}
                <Text className="text-center text-lg text-accent-foreground">
                  {t.item.name}
                </Text>
              </View>
            </Pressable>
          )}
        />
      </View>
    </CustomSafeAreaView>
  );
};

export default ListPickerPage;
