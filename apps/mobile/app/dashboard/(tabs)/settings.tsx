import { SafeAreaView, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import PageTitle from "@/components/ui/PageTitle";
import { useSession } from "@/lib/session";
import { api } from "@/lib/trpc";

export default function Dashboard() {
  const { logout } = useSession();

  const { data, error, isLoading } = api.users.whoami.useQuery();

  if (error?.data?.code === "UNAUTHORIZED") {
    logout();
  }

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
