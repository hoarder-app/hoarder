import { View } from "react-native";
import BookmarkList from "@/components/bookmarks/BookmarkList";

export default function Archive() {
  return (
    <View>
      <BookmarkList archived />
    </View>
  );
}
