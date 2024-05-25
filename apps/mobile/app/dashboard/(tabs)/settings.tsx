import { Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import CustomSafeAreaView from "@/components/ui/CustomSafeAreaView";
import PageTitle from "@/components/ui/PageTitle";
import { useSession } from "@/lib/session";
import useAppSettings from "@/lib/settings";
import { api } from "@/lib/trpc";

export default function Dashboard() {
  const { logout } = useSession();
  const { settings, isLoading: isSettingsLoading } = useAppSettings();

  const { data, error, isLoading } = api.users.whoami.useQuery();

  if (error?.data?.code === "UNAUTHORIZED") {
    logout();
  }

  return (
    <CustomSafeAreaView>
      <PageTitle title="Settings" />
      <View className="flex h-full w-full items-center gap-3 px-4 py-2">
        <View className="w-full rounded-lg bg-white px-4 py-2 dark:bg-accent">
          <Text className="text-lg text-accent-foreground">
            {isSettingsLoading ? "Loading ..." : settings.address}
          </Text>
        </View>
        <View className="w-full rounded-lg bg-white px-4 py-2 dark:bg-accent">
          <Text className="text-lg text-accent-foreground">
            {isLoading ? "Loading ..." : data?.email}
          </Text>
        </View>

        <Button className="w-full" label="Log Out" onPress={logout} />
      </View>
    </CustomSafeAreaView>
  );
}
