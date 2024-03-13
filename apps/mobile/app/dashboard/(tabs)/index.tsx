import { View } from "react-native";
import { Link, Stack } from "expo-router";
import BookmarkList from "@/components/bookmarks/BookmarkList";
import { Link as LinkIcon, SquarePen } from "lucide-react-native";

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
