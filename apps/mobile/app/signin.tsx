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
import { Redirect } from "expo-router";
import Logo from "@/components/Logo";
import { TailwindResolver } from "@/components/TailwindResolver";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import useAppSettings from "@/lib/settings";
import { api } from "@/lib/trpc";

enum LoginType {
  Password,
  ApiKey,
}

export default function Signin() {
  const { settings, setSettings } = useAppSettings();

  const [error, setError] = useState<string | undefined>();
  const [loginType, setLoginType] = useState<LoginType>(LoginType.Password);
  const toggleLoginType = () => {
    setLoginType((prev) => {
      if (prev === LoginType.Password) {
        return LoginType.ApiKey;
      } else {
        return LoginType.Password;
      }
    });
  };

  const { mutate: login, isPending: userNamePasswordRequestIsPending } =
    api.apiKeys.exchange.useMutation({
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

  const { mutate: validateApiKey, isPending: apiKeyValueRequestIsPending } =
    api.apiKeys.validate.useMutation({
      onSuccess: () => {
        setSettings({ ...settings, apiKey: apiFormData.apiKey });
      },
      onError: (e) => {
        if (e.data?.code === "UNAUTHORIZED") {
          setError("Invalid API key");
        } else {
          setError(`${e.message}`);
        }
      },
    });

  const [usernameFormData, setUserNameFormData] = useState<{
    email: string;
    password: string;
  }>({
    email: "",
    password: "",
  });

  const [apiFormData, setApiFormData] = useState<{
    apiKey: string;
  }>({
    apiKey: "",
  });

  if (settings.apiKey) {
    return <Redirect href="dashboard" />;
  }

  const onSignin = () => {
    if (loginType === LoginType.Password) {
      const randStr = (Math.random() + 1).toString(36).substring(5);
      login({ ...usernameFormData, keyName: `Mobile App: (${randStr})` });
    } else if (loginType === LoginType.ApiKey) {
      validateApiKey({ apiKey: apiFormData.apiKey });
    }
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
          {loginType === LoginType.Password && (
            <>
              <View className="gap-2">
                <Text className="font-bold">Email</Text>
                <Input
                  className="w-full"
                  placeholder="Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={usernameFormData.email}
                  onChangeText={(e) =>
                    setUserNameFormData((s) => ({ ...s, email: e.trim() }))
                  }
                />
              </View>
              <View className="gap-2">
                <Text className="font-bold">Password</Text>
                <Input
                  className="w-full"
                  placeholder="Password"
                  secureTextEntry
                  value={usernameFormData.password}
                  autoCapitalize="none"
                  textContentType="password"
                  onChangeText={(e) =>
                    setUserNameFormData((s) => ({ ...s, password: e }))
                  }
                />
              </View>
            </>
          )}

          {loginType === LoginType.ApiKey && (
            <View className="gap-2">
              <Text className="font-bold">API Key</Text>
              <Input
                className="w-full"
                placeholder="API Key"
                secureTextEntry
                value={apiFormData.apiKey}
                autoCapitalize="none"
                textContentType="password"
                onChangeText={(e) =>
                  setApiFormData((s) => ({ ...s, apiKey: e }))
                }
              />
            </View>
          )}

          <View className="flex flex-row items-center justify-between gap-2">
            <Button
              className="flex-1"
              label="Sign In"
              onPress={onSignin}
              disabled={
                userNamePasswordRequestIsPending || apiKeyValueRequestIsPending
              }
            />
          </View>
          <Pressable onPress={toggleLoginType}>
            <Text className="mt-2 text-center text-gray-500">
              {loginType === LoginType.Password
                ? "Use API key instead?"
                : "Use password instead?"}
            </Text>
          </Pressable>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
