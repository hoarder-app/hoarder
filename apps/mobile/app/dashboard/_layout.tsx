import { Stack } from "expo-router/stack";

export default function Dashboard() {
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
