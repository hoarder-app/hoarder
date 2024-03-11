import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";

const SETTING_NAME = "settings";

export type Settings = {
  apiKey: string;
  address: string;
};

export default function useAppSettings() {
  const [settings, setSettings] = useState<Settings>({
    apiKey: "",
    address: "",
  });

  useEffect(() => {
    SecureStore.setItemAsync(SETTING_NAME, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    SecureStore.getItemAsync(SETTING_NAME).then((val) => {
      if (!val) {
        return;
      }
      setSettings(JSON.parse(val));
    });
  }, []);

  return { settings, setSettings };
}

export async function getAppSettings() {
  const val = await SecureStore.getItemAsync(SETTING_NAME);
  if (!val) {
    return null;
  }
  return JSON.parse(val) as Settings;
}
