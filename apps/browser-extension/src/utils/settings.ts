import React from "react";

export interface Settings {
  apiKey: string;
  apiKeyId?: string;
  address: string;
}

const STORAGE = chrome.storage.sync;

export default function usePluginSettings() {
  const [settings, setSettingsInternal] = React.useState<Settings>({
    apiKey: "",
    address: "",
  });

  const [isInit, setIsInit] = React.useState(false);

  React.useEffect(() => {
    if (!isInit) {
      getPluginSettings().then((settings) => {
        setSettingsInternal(settings);
        setIsInit(true);
      });
    }
    const onChange = (
      changes: Record<string, chrome.storage.StorageChange>,
    ) => {
      if (changes.settings === undefined) {
        return;
      }
      setSettingsInternal(changes.settings.newValue as Settings);
    };
    STORAGE.onChanged.addListener(onChange);
    return () => {
      STORAGE.onChanged.removeListener(onChange);
    };
  }, []);

  const setSettings = async (s: (_: Settings) => Settings) => {
    const newVal = s(settings);
    await STORAGE.set({ settings: newVal });
  };

  return { settings, setSettings, isPending: isInit };
}

export async function getPluginSettings() {
  return (await STORAGE.get("settings")).settings as Settings;
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
