import { useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { Link } from "expo-router";
import { TailwindResolver } from "@/components/TailwindResolver";
import CustomSafeAreaView from "@/components/ui/CustomSafeAreaView";
import PageTitle from "@/components/ui/PageTitle";
import { api } from "@/lib/trpc";
import { ChevronRight } from "lucide-react-native";

import { useBookmarkLists } from "@hoarder/shared-react/hooks/lists";
import { ZBookmarkListTreeNode } from "@hoarder/shared/utils/listUtils";

interface ListLink {
  id: string;
  logo: string;
  name: string;
  href: string;
  level: number;
  parent?: string;
  numChildren: number;
  collapsed: boolean;
}

function traverseTree(
  node: ZBookmarkListTreeNode,
  links: ListLink[],
  showChildrenOf: Record<string, boolean>,
  parent?: string,
  level = 0,
) {
  links.push({
    id: node.item.id,
    logo: node.item.icon,
    name: node.item.name,
    href: `/dashboard/lists/${node.item.id}`,
    level,
    parent,
    numChildren: node.children?.length ?? 0,
    collapsed: !showChildrenOf[node.item.id],
  });

  if (node.children && showChildrenOf[node.item.id]) {
    node.children.forEach((child) =>
      traverseTree(child, links, showChildrenOf, node.item.id, level + 1),
    );
  }
}

export default function Lists() {
  const [refreshing, setRefreshing] = useState(false);
  const { data: lists, isPending } = useBookmarkLists();
  const [showChildrenOf, setShowChildrenOf] = useState<Record<string, boolean>>(
    {},
  );
  const apiUtils = api.useUtils();

  useEffect(() => {
    setRefreshing(isPending);
  }, [isPending]);

  if (!lists) {
    // Add spinner
    return <View />;
  }

  const onRefresh = () => {
    apiUtils.lists.list.invalidate();
  };

  const links: ListLink[] = [
    {
      id: "fav",
      logo: "⭐️",
      name: "Favourites",
      href: "/dashboard/favourites",
      level: 0,
      numChildren: 0,
      collapsed: false,
    },
    {
      id: "arch",
      logo: "🗄️",
      name: "Archive",
      href: "/dashboard/archive",
      level: 0,
      numChildren: 0,
      collapsed: false,
    },
  ];

  Object.values(lists.root).forEach((list) =>
    traverseTree(list, links, showChildrenOf),
  );

  return (
    <CustomSafeAreaView>
      <FlatList
        className="h-full"
        ListHeaderComponent={<PageTitle title="Lists" />}
        contentContainerStyle={{
          gap: 5,
        }}
        renderItem={(l) => (
          <View
            className="mx-2 flex flex-row items-center rounded-xl border border-input bg-white px-4 py-2 dark:bg-accent"
            style={{ marginLeft: l.item.level * 20 }}
          >
            {l.item.numChildren > 0 && (
              <Pressable
                className="pr-2"
                onPress={() => {
                  setShowChildrenOf((prev) => ({
                    ...prev,
                    [l.item.id]: !prev[l.item.id],
                  }));
                }}
              >
                <TailwindResolver
                  className="text-foreground"
                  comp={(style) => (
                    <ChevronRight
                      color={style?.color?.toString()}
                      style={{
                        transform: [
                          { rotate: l.item.collapsed ? "0deg" : "90deg" },
                        ],
                      }}
                    />
                  )}
                />
              </Pressable>
            )}

            <Link asChild key={l.item.id} href={l.item.href} className="flex-1">
              <Pressable className="flex flex-row justify-between">
                <Text className="text-lg text-accent-foreground">
                  {l.item.logo} {l.item.name}
                </Text>
                <ChevronRight color="rgb(0, 122, 255)" />
              </Pressable>
            </Link>
          </View>
        )}
        data={links}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </CustomSafeAreaView>
  );
}
