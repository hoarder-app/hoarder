import { ImageURISource } from "react-native";
import { searchHistoryUtil } from "@/lib/searchHistory";

import { useSearchHistory as useSharedSearchHistory } from "@karakeep/shared-react/hooks/search-history";

import useAppSettings from "./settings";

export function useAssetUrl(assetId: string): ImageURISource {
  const { settings } = useAppSettings();
  return {
    uri: `${settings.address}/api/assets/${assetId}`,
    headers: {
      Authorization: `Bearer ${settings.apiKey}`,
    },
  };
}

export function useSearchHistory() {
  return useSharedSearchHistory(searchHistoryUtil);
}
