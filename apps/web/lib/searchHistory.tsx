const BOOKMARK_SEARCH_HISTORY_KEY = "karakeep_search_history";
const MAX_HISTORY_ITEMS = 5;

export function getSearchHistory(): string[] {
  try {
    const rawHistory = localStorage.getItem(BOOKMARK_SEARCH_HISTORY_KEY);
    if (rawHistory) {
      const parsed = JSON.parse(rawHistory) as string[];
      if (
        Array.isArray(parsed) &&
        parsed.every((item) => typeof item === "string")
      ) {
        return parsed;
      }
    }
    return [];
  } catch (error) {
    console.error("Failed to parse search history:", error);
    return [];
  }
}

export function addSearchTermToHistory(term: string) {
  if (!term || term.trim().length === 0) {
    return;
  }
  const currentHistory = getSearchHistory();
  const filteredHistory = currentHistory.filter(
    (item) => item.toLowerCase() !== term.toLowerCase(),
  );
  const newHistory = [term, ...filteredHistory];
  const finalHistory = newHistory.slice(0, MAX_HISTORY_ITEMS);
  localStorage.setItem(
    BOOKMARK_SEARCH_HISTORY_KEY,
    JSON.stringify(finalHistory),
  );
}
