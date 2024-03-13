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
          title: "⭐️ Favourites",
        }}
      />
      <Stack.Screen
        name="archive"
        options={{
          title: "🗄️ Archive",
        }}
      />
    </Stack>
  );
}
