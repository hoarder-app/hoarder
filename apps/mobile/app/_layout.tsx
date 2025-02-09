import "@/globals.css";
import "expo-dev-client";

import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useRouter } from "expo-router";
import { Stack } from "expo-router/stack";
import { ShareIntentProvider, useShareIntent } from "expo-share-intent";
import { StatusBar } from "expo-status-bar";
import { StyledStack } from "@/components/navigation/stack";
import { Providers } from "@/lib/providers";
import useAppSettings from "@/lib/settings";
import { cn } from "@/lib/utils";
import { useColorScheme } from "nativewind";

export default function RootLayout() {
  const router = useRouter();
  const { hasShareIntent } = useShareIntent();
  const { colorScheme, setColorScheme } = useColorScheme();
  const { settings } = useAppSettings();

  useEffect(() => {
    if (hasShareIntent) {
      router.replace({
        pathname: "sharing",
      });
    }
  }, [hasShareIntent]);

  useEffect(() => {
    setColorScheme(settings.theme);
  }, [settings.theme]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ShareIntentProvider>
        <Providers>
          <StyledStack
            contentClassName={cn(
              "w-full flex-1 bg-gray-100 text-foreground dark:bg-background",
              colorScheme == "dark" ? "dark" : "light",
            )}
            screenOptions={{
              headerTitle: "",
              headerTransparent: true,
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen
              name="signin"
              options={{
                headerShown: true,
                headerBackVisible: true,
                headerBackTitle: "Back",
                title: "",
              }}
            />
            <Stack.Screen name="sharing" />
            <Stack.Screen
              name="test-connection"
              options={{
                title: "Test Connection",
                headerShown: true,
                presentation: "modal",
              }}
            />
          </StyledStack>
          <StatusBar style="auto" />
        </Providers>
      </ShareIntentProvider>
    </GestureHandlerRootView>
  );
}
