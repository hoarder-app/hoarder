import AsyncStorage from "@react-native-async-storage/async-storage";

const BOOKMARK_SEARCH_HISTORY_KEY = "karakeep_search_history";
const MAX_HISTORY_ITEMS = 5;

export async function getSearchHistory(): Promise<string[]> {
  try {
    const rawHistory = await AsyncStorage.getItem(BOOKMARK_SEARCH_HISTORY_KEY);
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

export async function addSearchTermToHistory(term: string) {
  if (!term || term.trim().length === 0) {
    return;
  }
  try {
    const currentHistory = await getSearchHistory();
    const filteredHistory = currentHistory.filter(
      (item) => item.toLowerCase() !== term.toLowerCase(),
    );
    const newHistory = [term, ...filteredHistory];
    const finalHistory = newHistory.slice(0, MAX_HISTORY_ITEMS);
    await AsyncStorage.setItem(
      BOOKMARK_SEARCH_HISTORY_KEY,
      JSON.stringify(finalHistory),
    );
  } catch (error) {
    console.error("Failed to save search history:", error);
  }
}

export async function clearSearchHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(BOOKMARK_SEARCH_HISTORY_KEY);
  } catch (error) {
    console.error("Failed to clear search history:", error);
  }
}
