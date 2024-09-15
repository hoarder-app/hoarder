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
import { api } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Bug } from "lucide-react-native";

export default function Signin() {
  const router = useRouter();
  const { settings, setSettings } = useAppSettings();
  const [serverAddress, setServerAddress] = useState(settings.address);

  const [error, setError] = useState<string | undefined>();

  const { mutate: login, isPending } = api.apiKeys.exchange.useMutation({
    onSuccess: (resp) => {
      setSettings({ ...settings, apiKey: resp.key, apiKeyId: resp.id });
    },
    onError: (e) => {
      if (e.data?.code === "UNAUTHORIZED") {
        setError("Wrong username or password");
      } else {
        setError(`${e.message}`);
      }
    },
  });

  const [formData, setFormData] = useState<{
    email: string;
    password: string;
  }>({
    email: "",
    password: "",
  });

  if (settings.apiKey) {
    return <Redirect href="dashboard" />;
  }

  const onSignin = () => {
    const randStr = (Math.random() + 1).toString(36).substring(5);
    login({ ...formData, keyName: `Mobile App: (${randStr})` });
  };

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
          {error && (
            <Text className="w-full text-center text-red-500">{error}</Text>
          )}
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
          <View className="gap-2">
            <Text className="font-bold">Email</Text>
            <Input
              className="w-full"
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.email}
              onChangeText={(e) => setFormData((s) => ({ ...s, email: e }))}
            />
          </View>
          <View className="gap-2">
            <Text className="font-bold">Password</Text>
            <Input
              className="w-full"
              placeholder="Password"
              secureTextEntry
              value={formData.password}
              autoCapitalize="none"
              textContentType="password"
              onChangeText={(e) => setFormData((s) => ({ ...s, password: e }))}
            />
          </View>
          <View className="flex flex-row items-center justify-between gap-2">
            <Button
              className="flex-1"
              label="Sign In"
              onPress={onSignin}
              disabled={isPending}
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
