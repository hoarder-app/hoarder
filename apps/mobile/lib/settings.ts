import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

const SETTING_NAME = "settings";

export interface Settings {
  apiKey?: string;
  apiKeyId?: string;
  address: string;
}

interface AppSettingsState {
  settings: { isLoading: boolean; settings: Settings };
  setSettings: (settings: Settings) => Promise<void>;
  load: () => Promise<void>;
}

const useSettings = create<AppSettingsState>((set, get) => ({
  settings: {
    isLoading: true,
    settings: { address: "" },
  },
  setSettings: async (settings) => {
    await SecureStore.setItemAsync(SETTING_NAME, JSON.stringify(settings));
    set((_state) => ({ settings: { isLoading: false, settings } }));
  },
  load: async () => {
    if (!get().settings.isLoading) {
      return;
    }
    const strVal = await SecureStore.getItemAsync(SETTING_NAME);
    if (!strVal) {
      set((state) => ({
        settings: { isLoading: false, settings: state.settings.settings },
      }));
      return;
    }
    // TODO Wipe the state if invalid
    const parsed = JSON.parse(strVal) as Settings;
    set((_state) => ({ settings: { isLoading: false, settings: parsed } }));
  },
}));

export default function useAppSettings() {
  const { settings, setSettings, load } = useSettings();

  return { ...settings, setSettings, load };
}
