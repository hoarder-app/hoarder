import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  SearchHistoryUtil,
  StorageAdapter,
} from "@karakeep/shared-react/utils/searchHistory";

export class AsyncStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    return await AsyncStorage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }
}

export const searchHistoryUtil = new SearchHistoryUtil(
  new AsyncStorageAdapter(),
);

export const getSearchHistory = () => searchHistoryUtil.getSearchHistory();
export const addSearchTermToHistory = (term: string) =>
  searchHistoryUtil.addSearchTermToHistory(term);
export const clearSearchHistory = () => searchHistoryUtil.clearSearchHistory();
