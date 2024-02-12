import { useChromeStorageSync } from "use-chrome-storage";

export type Settings = {
  apiKey: string;
  address: string;
};

export default function usePluginSettings() {
  return useChromeStorageSync("settings", {
    apiKey: "",
    address: "",
  } as Settings);
}
