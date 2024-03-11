import "@/globals.css";

import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";

export default function RootLayout() {
  return (
    <View className="w-full h-full bg-white">
      <Slot />
      <StatusBar style="auto" />
    </View>
  );
}
