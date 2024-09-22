import { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Redirect, useRouter } from "expo-router";
import Logo from "@/components/Logo";
import { TailwindResolver } from "@/components/TailwindResolver";
import { Button, buttonVariants } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import useAppSettings from "@/lib/settings";
import { cn } from "@/lib/utils";
import { Bug } from "lucide-react-native";

export default function ServerAddress() {
  const router = useRouter();
  const { settings, setSettings } = useAppSettings();
  const [serverAddress, setServerAddress] = useState(settings.address);

  if (settings.apiKey) {
    return <Redirect href="dashboard" />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex h-full flex-col justify-center gap-2 px-4">
          <View className="items-center">
            <TailwindResolver
              className="color-foreground"
              comp={(styles) => (
                <Logo
                  height={150}
                  width={200}
                  fill={styles?.color?.toString()}
                />
              )}
            />
          </View>
          <View className="gap-2">
            <Text className="font-bold">Server Address</Text>
            <Input
              className="w-full"
              placeholder="Server Address"
              value={serverAddress}
              autoCapitalize="none"
              keyboardType="url"
              onChangeText={(e) => {
                setServerAddress(e);
                setSettings({ ...settings, address: e.replace(/\/$/, "") });
              }}
            />
          </View>
          <View className="flex flex-row items-center justify-between gap-2">
            <Button
              className="flex-1"
              label="Next"
              onPress={() => router.push("/signin")}
            />
            <Pressable
              className={cn(
                buttonVariants({ variant: "default" }),
                !settings.address && "bg-gray-500",
              )}
              onPress={() => router.push("/test-connection")}
              disabled={!settings.address}
            >
              <TailwindResolver
                comp={(styles) => (
                  <Bug size={20} color={styles?.color?.toString()} />
                )}
                className="text-background"
              />
            </Pressable>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
