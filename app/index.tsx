import { Link } from "expo-router";
import { View } from "react-native";

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Link href="/signin" className="">
        Signin
      </Link>
    </View>
  );
}
