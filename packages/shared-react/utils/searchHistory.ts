import { z } from "zod";

export interface StorageAdapter {
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
  removeItem(key: string): Promise<void> | void;
}

const searchHistorySchema = z.array(z.string());

const BOOKMARK_SEARCH_HISTORY_KEY = "karakeep_search_history";
const MAX_STORED_ITEMS = 50;

export class SearchHistoryUtil {
  constructor(private storage: StorageAdapter) {}

  async getSearchHistory(): Promise<string[]> {
    try {
      const rawHistory = await this.storage.getItem(
        BOOKMARK_SEARCH_HISTORY_KEY,
      );
      if (rawHistory) {
        const parsed = JSON.parse(rawHistory) as unknown;
        const result = searchHistorySchema.safeParse(parsed);
        if (result.success) {
          return result.data;
        }
      }
      return [];
    } catch (error) {
      console.error("Failed to parse search history:", error);
      return [];
    }
  }

  async addSearchTermToHistory(term: string): Promise<void> {
    if (!term || term.trim().length === 0) {
      return;
    }
    try {
      const currentHistory = await this.getSearchHistory();
      const filteredHistory = currentHistory.filter(
        (item) => item.toLowerCase() !== term.toLowerCase(),
      );
      const newHistory = [term, ...filteredHistory];
      const finalHistory = newHistory.slice(0, MAX_STORED_ITEMS);
      await this.storage.setItem(
        BOOKMARK_SEARCH_HISTORY_KEY,
        JSON.stringify(finalHistory),
      );
    } catch (error) {
      console.error("Failed to save search history:", error);
    }
  }

  async clearSearchHistory(): Promise<void> {
    try {
      await this.storage.removeItem(BOOKMARK_SEARCH_HISTORY_KEY);
    } catch (error) {
      console.error("Failed to clear search history:", error);
    }
  }
}
