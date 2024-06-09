import { useChromeStorageSync } from "use-chrome-storage";

export interface Settings {
  apiKey: string;
  apiKeyId?: string;
  address: string;
}

export default function usePluginSettings() {
  const [settings, setSettings, _1, _2, isInit] = useChromeStorageSync(
    "settings",
    {
      apiKey: "",
      address: "",
    } as Settings,
  );

  return { settings, setSettings, isPending: isInit };
}

export async function getPluginSettings() {
  return (await chrome.storage.sync.get("settings")).settings as Settings;
}

export function subscribeToSettingsChanges(
  callback: (settings: Settings) => void,
) {
  chrome.storage.sync.onChanged.addListener((changes) => {
    if (changes.settings === undefined) {
      return;
    }
    callback(changes.settings.newValue as Settings);
  });
}
