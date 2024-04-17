import type { AppStateStatus } from "react-native";
import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Stack } from "expo-router/stack";
import { StyledStack } from "@/components/navigation/stack";
import { useIsLoggedIn } from "@/lib/session";
import { focusManager } from "@tanstack/react-query";

function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== "web") {
    focusManager.setFocused(status === "active");
  }
}

export default function Dashboard() {
  const router = useRouter();

  const isLoggedIn = useIsLoggedIn();
  useEffect(() => {
    if (isLoggedIn !== undefined && !isLoggedIn) {
      return router.replace("signin");
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", onAppStateChange);

    return () => subscription.remove();
  }, []);

  return (
    <StyledStack
      contentClassName="bg-gray-100 dark:bg-background"
      headerClassName="bg-gray-100 dark:bg-background text-foreground"
    >
      <Stack.Screen
        name="(tabs)"
        options={{ headerShown: false, title: "Home" }}
      />
      <Stack.Screen
        name="favourites"
        options={{
          headerTitle: "",
          headerBackTitle: "Back",
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="archive"
        options={{
          headerTitle: "",
          headerBackTitle: "Back",
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="add-link"
        options={{
          title: "New link",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="add-note"
        options={{
          title: "New Note",
          presentation: "modal",
        }}
      />
    </StyledStack>
  );
}
