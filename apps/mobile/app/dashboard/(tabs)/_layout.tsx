import React from "react";
import { Tabs } from "expo-router";
import { StyledTabs } from "@/components/navigation/tabs";
import { ClipboardList, Home, Search, Settings } from "lucide-react-native";

export default function TabLayout() {
  return (
    <StyledTabs
      tabBarClassName="bg-gray-100 dark:bg-background pt-3"
      sceneContainerClassName="bg-gray-100 dark:bg-background"
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
    </StyledTabs>
  );
}
