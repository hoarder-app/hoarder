import {
  SearchHistoryUtil,
  StorageAdapter,
} from "@karakeep/shared-react/utils/searchHistory";

export class LocalStorageAdapter implements StorageAdapter {
  getItem(key: string): string | null {
    return localStorage.getItem(key);
  }

  setItem(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }
}

export const searchHistoryUtil = new SearchHistoryUtil(
  new LocalStorageAdapter(),
);

export const getSearchHistory = () => searchHistoryUtil.getSearchHistory();
export const addSearchTermToHistory = (term: string) =>
  searchHistoryUtil.addSearchTermToHistory(term);
export const clearSearchHistory = () => searchHistoryUtil.clearSearchHistory();
