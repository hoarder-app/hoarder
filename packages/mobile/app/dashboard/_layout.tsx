import { Stack } from "expo-router/stack";

export default function Dashboard() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
