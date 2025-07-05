import { useCallback, useEffect, useState } from "react";

import { SearchHistoryUtil } from "../utils/searchHistory";

export function useSearchHistory(searchHistoryUtil: SearchHistoryUtil) {
  const [history, setHistory] = useState<string[]>([]);

  const loadHistory = useCallback(async () => {
    const storedHistory = await searchHistoryUtil.getSearchHistory();
    setHistory(storedHistory);
  }, [searchHistoryUtil]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const addTerm = useCallback(
    async (term: string) => {
      await searchHistoryUtil.addSearchTermToHistory(term);
      await loadHistory();
    },
    [searchHistoryUtil, loadHistory],
  );

  const clearHistory = useCallback(async () => {
    await searchHistoryUtil.clearSearchHistory();
    setHistory([]);
  }, [searchHistoryUtil]);

  return {
    history,
    addTerm,
    clearHistory,
    refreshHistory: loadHistory,
  };
}
