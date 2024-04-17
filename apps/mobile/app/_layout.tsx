import "@/globals.css";
import "expo-dev-client";

import { useEffect } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Stack } from "expo-router/stack";
import { ShareIntentProvider, useShareIntent } from "expo-share-intent";
import { StatusBar } from "expo-status-bar";
import { StyledStack } from "@/components/navigation/stack";
import { Providers } from "@/lib/providers";
import { cn } from "@/lib/utils";
import { useColorScheme } from "nativewind";

export default function RootLayout() {
  const router = useRouter();
  const { hasShareIntent } = useShareIntent();
  const { colorScheme } = useColorScheme();

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
        <View
          className={cn(
            "w-full flex-1 bg-gray-100 text-foreground dark:bg-background",
            colorScheme == "dark" ? "dark" : "light",
          )}
        >
          <StyledStack
            contentClassName="bg-gray-100 dark:bg-background"
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
          </StyledStack>
          <StatusBar style="auto" />
        </View>
      </Providers>
    </ShareIntentProvider>
  );
}
