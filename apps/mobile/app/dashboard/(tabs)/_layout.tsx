import React, { useEffect } from "react";
import { Tabs } from "expo-router";
import { ClipboardList, Home, Search, Settings } from "lucide-react-native";
import { Platform } from "react-native";
import * as NavigationBar from 'expo-navigation-bar';

export default function TabLayout() {
  useEffect(() => {
    if (Platform.OS == "android") {
      NavigationBar.setBackgroundColorAsync("white");
    }
  }, []);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Home color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color }) => <Search color={color} />,
        }}
      />
      <Tabs.Screen
        name="lists"
        options={{
          title: "Lists",
          tabBarIcon: ({ color }) => <ClipboardList color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <Settings color={color} />,
        }}
      />
    </Tabs>
  );
}
