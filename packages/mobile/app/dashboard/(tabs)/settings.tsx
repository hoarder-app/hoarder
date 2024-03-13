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
    <View className="flex h-full items-center justify-center gap-4 px-4">
      <Logo />
      <Text className="justify-center">
        Logged in as: {isLoading ? "Loading ..." : data?.email}
      </Text>
      <Button label="Log Out" onPress={logout} />
    </View>
  );
}
