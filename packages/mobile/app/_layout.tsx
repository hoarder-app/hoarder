import "@/globals.css";
import "expo-dev-client";

import { useRouter } from "expo-router";
import { Stack } from "expo-router/stack";
import { useShareIntent } from "expo-share-intent";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";

import { Providers } from "@/lib/providers";

export default function RootLayout() {
  const router = useRouter();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();

  useEffect(() => {
    if (hasShareIntent) {
      router.replace({
        pathname: "sharing",
        params: { shareIntent: JSON.stringify(shareIntent) },
      });
      resetShareIntent();
    }
  }, [hasShareIntent]);

  return (
    <Providers>
      <View className="h-full w-full bg-white">
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
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
  );
}
