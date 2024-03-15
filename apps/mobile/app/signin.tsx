import { useEffect, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import useAppSettings from "@/lib/settings";
import { api } from "@/lib/trpc";

export default function Signin() {
  const router = useRouter();

  const { settings, setSettings } = useAppSettings();

  const [error, setError] = useState<string | undefined>();

  const { mutate: login, isPending } = api.apiKeys.exchange.useMutation({
    onSuccess: (resp) => {
      setSettings({ ...settings, apiKey: resp.key });
      router.replace("dashboard");
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

  useEffect(() => {
    if (settings.apiKey) {
      router.navigate("dashboard");
    }
  }, [settings]);

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
            <Logo />
          </View>
          {error && (
            <Text className="w-full text-center text-red-500">{error}</Text>
          )}
          <View className="gap-2">
            <Text className="font-bold">Server Address</Text>
            <Input
              className="w-full"
              placeholder="Server Address"
              value={settings.address}
              autoCapitalize="none"
              keyboardType="url"
              onEndEditing={(e) =>
                setSettings({ ...settings, address: e.nativeEvent.text })
              }
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
              onChangeText={(e) => setFormData((s) => ({ ...s, password: e }))}
            />
          </View>
          <Button
            className="w-full"
            label="Sign In"
            onPress={onSignin}
            disabled={isPending}
          />
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
