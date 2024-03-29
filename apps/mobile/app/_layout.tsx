import "@/globals.css";
import "expo-dev-client";

import { useEffect } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Stack } from "expo-router/stack";
import { ShareIntentProvider, useShareIntent } from "expo-share-intent";
import { StatusBar } from "expo-status-bar";
import { Providers } from "@/lib/providers";

export default function RootLayout() {
  const router = useRouter();
  const { hasShareIntent } = useShareIntent();

  useEffect(() => {
    if (hasShareIntent) {
      router.replace({
        pathname: "sharing",
      });
    }
  }, [hasShareIntent]);

  return (
    <ShareIntentProvider>
      <Providers>
        <View className="w-full flex-1 bg-background">
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen
              name="sharing"
              options={{
                presentation: "modal",
              }}
            />
          </Stack>
          <StatusBar style="auto" />
        </View>
      </Providers>
    </ShareIntentProvider>
  );
}
