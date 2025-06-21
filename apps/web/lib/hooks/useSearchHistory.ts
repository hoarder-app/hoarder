import { useCallback, useEffect, useState } from "react";
import { addSearchTermToHistory, getSearchHistory } from "@/lib/searchHistory";

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    setHistory(getSearchHistory());
  }, []);

  const addTerm = useCallback((term: string) => {
    addSearchTermToHistory(term);
    setHistory(getSearchHistory());
  }, []);

  return { history, addTerm };
}
