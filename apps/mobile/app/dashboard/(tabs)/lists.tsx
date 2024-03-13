import { useEffect, useState } from "react";
import { FlatList, View } from "react-native";
import { Link } from "expo-router";
import { api } from "@/lib/trpc";

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
    <FlatList
      contentContainerStyle={{
        gap: 10,
        marginTop: 10,
      }}
      renderItem={(l) => (
        <View className="mx-2 block rounded-xl border border-gray-100 bg-white px-4 py-2">
          <Link key={l.item.id} href={l.item.href} className="text-lg">
            {l.item.logo} {l.item.name}
          </Link>
        </View>
      )}
      data={links}
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  );
}
