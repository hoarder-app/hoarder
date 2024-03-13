import { Link, Stack } from "expo-router";
import { SquarePen, Link as LinkIcon } from "lucide-react-native";
import { View } from "react-native";

import BookmarkList from "@/components/bookmarks/BookmarkList";

function HeaderRight() {
  return (
    <View className="flex flex-row">
      <Link href="dashboard/add-link" className="mt-2 px-2">
        <LinkIcon />
      </Link>
      <Link href="dashboard/add-note" className="mt-2 px-2">
        <SquarePen />
      </Link>
    </View>
  );
}

export default function Home() {
  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => <HeaderRight />,
        }}
      />
      <BookmarkList archived={false} />
    </>
  );
}
