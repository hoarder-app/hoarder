import "@/globals.css";
import "expo-dev-client";

import { useRouter } from "expo-router";
import { Stack } from "expo-router/stack";
import { useShareIntent } from "expo-share-intent";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";

import { useLastSharedIntent } from "@/lib/last-shared-intent";
import { Providers } from "@/lib/providers";

export default function RootLayout() {
  const router = useRouter();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();

  const lastSharedIntent = useLastSharedIntent();

  useEffect(() => {
    const intentJson = JSON.stringify(shareIntent);
    if (hasShareIntent && !lastSharedIntent.isPreviouslyShared(intentJson)) {
      // TODO: Remove once https://github.com/achorein/expo-share-intent/issues/14 is fixed
      lastSharedIntent.setIntent(intentJson);
      router.replace({
        pathname: "sharing",
        params: { shareIntent: intentJson },
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
  );
}
