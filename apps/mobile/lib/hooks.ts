import { useCallback, useEffect, useState } from "react";
import { ImageURISource } from "react-native";
import {
  addSearchTermToHistory,
  clearSearchHistory,
  getSearchHistory,
} from "@/lib/searchHistory";

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
  const [history, setHistory] = useState<string[]>([]);

  const loadHistory = useCallback(async () => {
    const storedHistory = await getSearchHistory();
    setHistory(storedHistory);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const addTerm = useCallback(
    async (term: string) => {
      await addSearchTermToHistory(term);
      await loadHistory();
    },
    [loadHistory],
  );
  const clearHistory = useCallback(async () => {
    await clearSearchHistory();
    setHistory([]);
  }, []);

  return { history, addTerm, clearHistory, refreshHistory: loadHistory };
}
