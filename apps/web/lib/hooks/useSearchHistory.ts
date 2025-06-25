import { searchHistoryUtil } from "@/lib/searchHistory";

import { useSearchHistory as useSharedSearchHistory } from "@karakeep/shared-react/hooks/search-history";

export function useSearchHistory() {
  return useSharedSearchHistory(searchHistoryUtil);
}
