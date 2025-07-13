import { useEffect } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Slider } from "react-native-awesome-slider";
import { useSharedValue } from "react-native-reanimated";
import { Link } from "expo-router";
import { Button } from "@/components/ui/Button";
import CustomSafeAreaView from "@/components/ui/CustomSafeAreaView";
import { Divider } from "@/components/ui/Divider";
import PageTitle from "@/components/ui/PageTitle";
import { useSession } from "@/lib/session";
import useAppSettings from "@/lib/settings";
import { api } from "@/lib/trpc";
import { ChevronRight } from "lucide-react-native";

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

  const {
    data: userSettings,
    isLoading: isUserSettingsLoading,
    error: userSettingsError,
  } = api.users.settings.useQuery(undefined, {
    /**
     * Don't retry if the endpoint doesn't exist
     * maybe we can remove this after x months after release lol
     */
    retry: false,
  });

  const mobileBookmarkClickDefaultViewModeSupported =
    !userSettingsError &&
    userSettings &&
    "mobileBookmarkClickDefaultViewMode" in userSettings;

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
        <View className="flex w-full gap-3 rounded-lg bg-white px-4 py-2 dark:bg-accent">
          <Text className="text-lg text-accent-foreground">
            {isSettingsLoading ? "Loading ..." : settings.address}
          </Text>
          <Divider orientation="horizontal" />
          <Text className="text-lg text-accent-foreground">
            {isLoading ? "Loading ..." : data?.email}
          </Text>
        </View>
        <Text className="w-full p-1 text-2xl font-bold text-foreground">
          App Settings
        </Text>
        <View className="flex w-full flex-row items-center justify-between gap-8 rounded-lg bg-white px-4 py-2 dark:bg-accent">
          <Link asChild href="/dashboard/settings/theme" className="flex-1">
            <Pressable className="flex flex-row justify-between">
              <Text className="text-lg text-accent-foreground">Theme</Text>
              <View className="flex flex-row items-center gap-2">
                <Text className="text-lg text-muted-foreground">
                  {
                    { light: "Light", dark: "Dark", system: "System" }[
                      settings.theme
                    ]
                  }
                </Text>
                <ChevronRight color="rgb(0, 122, 255)" />
              </View>
            </Pressable>
          </Link>
        </View>
        {mobileBookmarkClickDefaultViewModeSupported && (
          <View className="flex w-full flex-row items-center justify-between gap-8 rounded-lg bg-white px-4 py-2 dark:bg-accent">
            <Link
              asChild
              href="/dashboard/settings/bookmark-default-view"
              className="flex-1"
            >
              <Pressable className="flex flex-row justify-between">
                <Text className="text-lg text-accent-foreground">
                  Bookmark View Mode
                </Text>
                <View className="flex flex-row items-center gap-2">
                  {isUserSettingsLoading ? (
                    <ActivityIndicator size="small" />
                  ) : (
                    <Text className="text-lg text-muted-foreground">
                      {(userSettings?.mobileBookmarkClickDefaultViewMode ||
                        "reader") === "reader"
                        ? "Reader"
                        : "Browser"}
                    </Text>
                  )}
                  <ChevronRight color="rgb(0, 122, 255)" />
                </View>
              </Pressable>
            </Link>
          </View>
        )}
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
        <Divider orientation="horizontal" />
        <Button className="w-full" label="Log Out" onPress={logout} />
      </View>
    </CustomSafeAreaView>
  );
}
