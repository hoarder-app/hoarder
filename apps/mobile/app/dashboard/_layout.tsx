import { useEffect } from "react";
import { useRouter } from "expo-router";
import { Stack } from "expo-router/stack";
import { useIsLoggedIn } from "@/lib/session";

export default function Dashboard() {
  const router = useRouter();

  const isLoggedIn = useIsLoggedIn();
  useEffect(() => {
    if (isLoggedIn !== undefined && !isLoggedIn) {
      return router.replace("signin");
    }
  }, [isLoggedIn]);

  return (
    <Stack>
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
    </Stack>
  );
}
