import { useEffect } from "react";
import { Text, View } from "react-native";
import { Slider } from "react-native-awesome-slider";
import { useSharedValue } from "react-native-reanimated";
import { Button } from "@/components/ui/Button";
import CustomSafeAreaView from "@/components/ui/CustomSafeAreaView";
import { Divider } from "@/components/ui/Divider";
import PageTitle from "@/components/ui/PageTitle";
import { useSession } from "@/lib/session";
import useAppSettings from "@/lib/settings";
import { api } from "@/lib/trpc";

export default function Dashboard() {
  const { logout } = useSession();
  const {
    settings,
    setSettings,
    isLoading: isSettingsLoading,
  } = useAppSettings();

  const imageQuality = useSharedValue(0);
  const imageQualityMin = useSharedValue(0);
  const imageQualityMax = useSharedValue(100);

  useEffect(() => {
    imageQuality.value = settings.imageQuality * 100;
  }, [settings]);

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
        <Divider orientation="horizontal" />
        <Text className="w-full p-1 text-2xl font-bold text-foreground">
          Upload Settings
        </Text>
        <View className="flex w-full flex-row items-center justify-between gap-8 rounded-lg bg-white px-4 py-2 dark:bg-accent">
          <Text className="text-lg text-accent-foreground">Image Quality</Text>
          <View className="flex flex-1 flex-row items-center justify-center gap-2">
            <Text className="text-foreground">
              {settings.imageQuality * 100}%
            </Text>
            <Slider
              onSlidingComplete={(value) =>
                setSettings({
                  ...settings,
                  imageQuality: Math.round(value) / 100,
                })
              }
              progress={imageQuality}
              minimumValue={imageQualityMin}
              maximumValue={imageQualityMax}
            />
          </View>
        </View>
      </View>
    </CustomSafeAreaView>
  );
}
