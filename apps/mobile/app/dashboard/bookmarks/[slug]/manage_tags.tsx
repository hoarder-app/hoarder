import React, { useMemo } from "react";
import { Pressable, SectionList, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { TailwindResolver } from "@/components/TailwindResolver";
import CustomSafeAreaView from "@/components/ui/CustomSafeAreaView";
import FullPageSpinner from "@/components/ui/FullPageSpinner";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { Check, Plus } from "lucide-react-native";

import { useUpdateBookmarkTags } from "@hoarder/shared-react/hooks/bookmarks";
import { api } from "@hoarder/shared-react/trpc";

const NEW_TAG_ID = "new-tag";

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

  const { data: allTags, isPending: isAllTagsPending } = api.tags.list.useQuery(
    undefined,
    {
      select: React.useCallback(
        (data: { tags: { id: string; name: string }[] }) => {
          return data.tags
            .map((t) => ({
              id: t.id,
              name: t.name,
              lowered: t.name.toLowerCase(),
            }))
            .sort((a, b) => a.lowered.localeCompare(b.lowered));
        },
        [],
      ),
    },
  );
  const { data: existingTags } = api.bookmarks.getBookmark.useQuery(
    {
      bookmarkId,
    },
    {
      select: React.useCallback(
        (data: { tags: { id: string; name: string }[] }) =>
          data.tags.map((t) => ({
            id: t.id,
            name: t.name,
            lowered: t.name.toLowerCase(),
          })),
        [],
      ),
    },
  );

  const [optimisticTags, setOptimisticTags] = React.useState(
    existingTags ?? [],
  );
  React.useEffect(() => {
    setOptimisticTags(existingTags ?? []);
  }, [existingTags]);

  const { mutate: updateTags } = useUpdateBookmarkTags({
    onMutate: (req) => {
      req.attach.forEach((t) =>
        setOptimisticTags((prev) => [
          ...prev,
          { id: t.tagId!, name: t.tagName!, lowered: t.tagName!.toLowerCase() },
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
    const loweredSearch = search.toLowerCase();
    let filteredAllTags = allTags?.filter(
      (t) =>
        t.lowered.startsWith(loweredSearch) &&
        !optimisticExistingTagIds.has(t.id),
    );
    let addCreateTag = false;
    if (allTags && search) {
      const exactMatchExists =
        allTags.some((t) => t.lowered == loweredSearch) ||
        optimisticTags.some((t) => t.lowered == loweredSearch);
      addCreateTag = !exactMatchExists;
    }
    if (filteredAllTags && addCreateTag) {
      filteredAllTags = [
        {
          id: NEW_TAG_ID,
          name: search,
          lowered: loweredSearch,
        },
        ...filteredAllTags,
      ];
    }

    const filteredOptimisticTags = optimisticTags.filter((t) =>
      t.lowered.startsWith(loweredSearch),
    );

    return { filteredAllTags, filteredOptimisticTags };
  }, [search, allTags, optimisticTags, optimisticExistingTagIds]);

  if (isAllTagsPending) {
    return <FullPageSpinner />;
  }

  return (
    <CustomSafeAreaView>
      <View className="px-3">
        <SectionList
          className="h-full"
          keyboardShouldPersistTaps="handled"
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
              data: filteredTags.filteredOptimisticTags ?? [],
            },
            {
              title: "All Tags",
              data: filteredTags.filteredAllTags ?? [],
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
                      ? [
                          {
                            tagId:
                              t.item.id == NEW_TAG_ID ? undefined : t.item.id,
                            tagName: t.item.name,
                          },
                        ]
                      : [],
                  attach:
                    t.section.title == "All Tags"
                      ? [
                          {
                            tagId:
                              t.item.id == NEW_TAG_ID ? undefined : t.item.id,
                            tagName: t.item.name,
                          },
                        ]
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
                {t.section.title == "All Tags" && t.item.id == NEW_TAG_ID && (
                  <TailwindResolver
                    className="text-accent-foreground"
                    comp={(s) => <Plus color={s?.color} />}
                  />
                )}
                <Text className="text-center text-lg text-accent-foreground">
                  {t.item.id == NEW_TAG_ID
                    ? `Create new tag '${t.item.name}'`
                    : t.item.name}
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
