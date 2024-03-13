import { View } from "react-native";

import BookmarkList from "@/components/bookmarks/BookmarkList";

export default function Home() {
  return (
    <View>
      <BookmarkList archived={false} />
    </View>
  );
}
