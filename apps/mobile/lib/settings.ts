import * as SecureStore from "expo-secure-store";

import { useStorageState } from "./storage-state";

const SETTING_NAME = "settings";

export interface Settings {
  apiKey?: string;
  address: string;
}

export default function useAppSettings() {
  const [settingsState, setSettings] = useStorageState<Settings>(SETTING_NAME);
  const [isLoading] = settingsState;
  let [, settings] = settingsState;

  settings ||= {
    address: "https://demo.hoarder.app",
  };

  return { settings, setSettings, isLoading };
}

export async function getAppSettings() {
  const val = await SecureStore.getItemAsync(SETTING_NAME);
  if (!val) {
    return null;
  }
  return JSON.parse(val) as Settings;
}
