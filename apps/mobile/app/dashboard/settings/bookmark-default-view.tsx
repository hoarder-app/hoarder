import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import CustomSafeAreaView from "@/components/ui/CustomSafeAreaView";
import { Divider } from "@/components/ui/Divider";
import PageTitle from "@/components/ui/PageTitle";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/trpc";
import { CheckCircle2 } from "lucide-react-native";

export default function BookmarkDefaultViewSettings() {
  const router = useRouter();
  const { toast } = useToast();

  const { data: userSettings, isLoading } = api.users.settings.useQuery();
  const { mutate: updateUserSettings } = api.users.updateSettings.useMutation({
    onSuccess: () => {
      toast({
        message: "Default view updated!",
        showProgress: false,
      });
      router.back();
    },
    onError: () => {
      toast({
        message: "Something went wrong",
        variant: "destructive",
        showProgress: false,
      });
    },
  });

  const viewModes = [
    {
      value: "browser" as const,
      label: "Browser",
      description: "Open bookmarks in web view",
    },
    {
      value: "reader" as const,
      label: "Reader",
      description: "Open bookmarks in reader mode",
    },
  ];

  const handleSelect = (mode: "browser" | "reader") => {
    updateUserSettings({
      mobileBookmarkClickDefaultViewMode: mode,
    });
  };

  return (
    <CustomSafeAreaView>
      <PageTitle title="Default View" />
      <View className="flex h-full w-full items-center gap-3 px-4 py-2">
        <Text className="w-full px-1 text-sm text-muted-foreground">
          Choose the default view mode when opening link bookmarks
        </Text>
        <View className="flex w-full gap-1 rounded-lg bg-white dark:bg-accent">
          {viewModes.map((mode, index) => (
            <View key={mode.value}>
              <Pressable
                onPress={() => handleSelect(mode.value)}
                disabled={isLoading}
                className="flex flex-row items-center justify-between px-4 py-3"
              >
                <View className="flex-1">
                  <Text className="text-lg text-accent-foreground">
                    {mode.label}
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    {mode.description}
                  </Text>
                </View>
                {userSettings?.mobileBookmarkClickDefaultViewMode ===
                  mode.value && (
                  <CheckCircle2 color="rgb(0, 122, 255)" size={24} />
                )}
              </Pressable>
              {index < viewModes.length - 1 && (
                <Divider orientation="horizontal" />
              )}
            </View>
          ))}
        </View>
      </View>
    </CustomSafeAreaView>
  );
}
