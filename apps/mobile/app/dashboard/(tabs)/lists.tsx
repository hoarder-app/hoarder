import { useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { Link } from "expo-router";
import CustomSafeAreaView from "@/components/ui/CustomSafeAreaView";
import PageTitle from "@/components/ui/PageTitle";
import { api } from "@/lib/trpc";
import { ChevronRight } from "lucide-react-native";

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
    <CustomSafeAreaView>
      <FlatList
        ListHeaderComponent={<PageTitle title="Lists" />}
        contentContainerStyle={{
          gap: 5,
        }}
        renderItem={(l) => (
          <Link asChild key={l.item.id} href={l.item.href}>
            <Pressable className="mx-2 flex flex-row justify-between rounded-xl border border-gray-100 bg-white px-4 py-2">
              <Text className="text-lg">
                {l.item.logo} {l.item.name}
              </Text>
              <ChevronRight color="rgb(0, 122, 255)" />
            </Pressable>
          </Link>
        )}
        data={links}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </CustomSafeAreaView>
  );
}
