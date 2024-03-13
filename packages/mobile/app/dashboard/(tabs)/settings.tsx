import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";

import Logo from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/lib/session";
import { api } from "@/lib/trpc";

export default function Dashboard() {
  const router = useRouter();

  const { isLoggedIn, logout } = useSession();

  useEffect(() => {
    if (isLoggedIn !== undefined && !isLoggedIn) {
      router.replace("signin");
    }
  }, [isLoggedIn]);

  const { data, error, isLoading } = api.users.whoami.useQuery();

  useEffect(() => {
    if (error?.data?.code === "UNAUTHORIZED") {
      logout();
    }
  }, [error]);

  return (
    <View className="flex h-full w-full items-center gap-4 p-4">
      <Logo />
      <View className="w-full rounded-lg bg-white px-4 py-2">
        <Text className="text-lg">
          {isLoading ? "Loading ..." : data?.email}
        </Text>
      </View>

      <Button className="w-full" label="Log Out" onPress={logout} />
    </View>
  );
}
