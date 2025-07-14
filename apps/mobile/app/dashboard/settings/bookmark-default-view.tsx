import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import CustomSafeAreaView from "@/components/ui/CustomSafeAreaView";
import { Divider } from "@/components/ui/Divider";
import { useToast } from "@/components/ui/Toast";
import useAppSettings from "@/lib/settings";
import { Check } from "lucide-react-native";

export default function BookmarkDefaultViewSettings() {
  const router = useRouter();
  const { toast } = useToast();
  const { settings, setSettings } = useAppSettings();

  const handleUpdate = async (mode: "reader" | "browser") => {
    try {
      await setSettings({
        ...settings,
        mobileBookmarkClickDefaultViewMode: mode,
      });
      toast({
        message: "Default Bookmark View updated!",
        showProgress: false,
      });
      router.back();
    } catch {
      toast({
        message: "Something went wrong",
        variant: "destructive",
        showProgress: false,
      });
    }
  };

  const options = (["reader", "browser"] as const)
    .map((mode) => {
      const currentMode = settings.mobileBookmarkClickDefaultViewMode;
      const isChecked = currentMode === mode;
      return [
        <Pressable
          onPress={() => handleUpdate(mode)}
          className="flex flex-row justify-between"
          key={mode}
        >
          <Text className="text-lg text-accent-foreground">
            {{ browser: "Browser", reader: "Reader" }[mode]}
          </Text>
          {isChecked && <Check color="rgb(0, 122, 255)" />}
        </Pressable>,
        <Divider
          key={mode + "-divider"}
          orientation="horizontal"
          className="my-3 h-0.5 w-full"
        />,
      ];
    })
    .flat();
  options.pop();

  return (
    <CustomSafeAreaView>
      <View className="flex h-full w-full items-center px-4 py-2">
        <View className="w-full rounded-lg bg-white px-4 py-2 dark:bg-accent">
          {options}
        </View>
      </View>
    </CustomSafeAreaView>
  );
}
