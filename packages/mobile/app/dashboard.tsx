import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";

import Logo from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import useAppSettings from "@/lib/settings";
import { api } from "@/lib/trpc";

export default function Main() {
  const router = useRouter();
  const { settings, setSettings, isLoading } = useAppSettings();

  useEffect(() => {
    if (!isLoading && !settings.apiKey) {
      router.replace("signin");
    }
  }, [settings, isLoading]);

  const onLogout = () => {
    setSettings({ ...settings, apiKey: undefined });
  };

  const { data } = api.users.whoami.useQuery();

  return (
    <View className="flex h-full items-center justify-center gap-4 px-4">
      <Logo />
      <Text className="justify-center">
        Logged in as: {isLoading ? "Loading ..." : data?.email}
      </Text>
      <Button label="Log Out" onPress={onLogout} />
    </View>
  );
}
