import { View } from "react-native";

import BookmarkList from "@/components/bookmarks/BookmarkList";

export default function Favourites() {
  return (
    <View>
      <BookmarkList archived={false} favourited />
    </View>
  );
}
