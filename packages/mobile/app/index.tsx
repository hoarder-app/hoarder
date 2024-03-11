import { Link } from "expo-router";
import { View } from "react-native";

export default function App() {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-white">
      <Link href="signin">Signin</Link>
      <Link href="dashboard">Dashboard</Link>
    </View>
  );
}
