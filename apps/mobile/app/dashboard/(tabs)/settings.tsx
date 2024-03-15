import { useEffect } from "react";
import { SafeAreaView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/lib/session";
import { api } from "@/lib/trpc";
import PageTitle from "@/components/ui/PageTitle";

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
    <SafeAreaView>
      <PageTitle title="Settings" />
      <View className="flex h-full w-full items-center gap-4 px-4 py-2">
        <View className="w-full rounded-lg bg-white px-4 py-2">
          <Text className="text-lg">
            {isLoading ? "Loading ..." : data?.email}
          </Text>
        </View>

        <Button className="w-full" label="Log Out" onPress={logout} />
      </View>
    </SafeAreaView>
  );
}
