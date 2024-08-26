import * as SecureStore from "expo-secure-store";
import { z } from "zod";
import { create } from "zustand";

const SETTING_NAME = "settings";

const zSettingsSchema = z.object({
  apiKey: z.string().optional(),
  apiKeyId: z.string().optional(),
  address: z.string(),
  imageQuality: z.number().optional().default(0.2),
});

export type Settings = z.infer<typeof zSettingsSchema>;

interface AppSettingsState {
  settings: { isLoading: boolean; settings: Settings };
  setSettings: (settings: Settings) => Promise<void>;
  load: () => Promise<void>;
}

const useSettings = create<AppSettingsState>((set, get) => ({
  settings: {
    isLoading: true,
    settings: { address: "", imageQuality: 0.2 },
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
    const parsed = zSettingsSchema.parse(JSON.parse(strVal));
    set((_state) => ({ settings: { isLoading: false, settings: parsed } }));
  },
}));

export default function useAppSettings() {
  const { settings, setSettings, load } = useSettings();

  return { ...settings, setSettings, load };
}
