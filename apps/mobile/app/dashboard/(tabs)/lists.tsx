import { useEffect, useState } from "react";
import { FlatList, Pressable, SafeAreaView, Text, View } from "react-native";
import { Link } from "expo-router";
import { api } from "@/lib/trpc";
import { ChevronRight } from "lucide-react-native";
import PageTitle from "@/components/ui/PageTitle";

export default function Lists() {
  const [refreshing, setRefreshing] = useState(false);
  const { data: lists, isPending } = api.lists.list.useQuery();
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

  const links = [
    {
      id: "fav",
      logo: "⭐️",
      name: "Favourites",
      href: "/dashboard/favourites",
    },
    {
      id: "arch",
      logo: "🗄️",
      name: "Archive",
      href: "/dashboard/archive",
    },
  ];

  links.push(
    ...lists.lists.map((l) => ({
      id: l.id,
      logo: l.icon,
      name: l.name,
      href: `/dashboard/lists/${l.id}`,
    })),
  );

  return (
    <SafeAreaView>
      <FlatList
        ListHeaderComponent={
          <PageTitle title="Lists" />
        }
        contentContainerStyle={{
          gap: 5,
        }}
        renderItem={(l) => (
          <Link asChild key={l.item.id} href={l.item.href}>
            <Pressable className="mx-2 flex flex-row justify-between rounded-xl border border-gray-100 bg-white px-4 py-2">
              <Text className="text-lg">
                {l.item.logo} {l.item.name}
              </Text>
              <ChevronRight />
            </Pressable>
          </Link>
        )}
        data={links}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </SafeAreaView>
  );
}
