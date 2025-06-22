import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  ZBookmarksSearchResult,
  ZSearchBookmarksCursor,
  ZSortOrder,
} from "@karakeep/shared/types/bookmarks";

interface SearchPaginationState {
  pages: ZBookmarksSearchResult[];
  pageParams: (ZSearchBookmarksCursor | null)[];
  scrollPosition: number;
  timestamp: number;
}

interface SortOrderState {
  sortOrder: ZSortOrder;
  setSortOrder: (sortOrder: ZSortOrder) => void;

  // Search pagination state management
  searchStates: Record<string, SearchPaginationState>;
  setSearchState: (
    searchQuery: string,
    state: Omit<SearchPaginationState, "timestamp">,
  ) => void;
  getSearchState: (searchQuery: string) => SearchPaginationState | null;
  clearOldSearchStates: () => void;
}

// Clear states older than 24 hours to prevent memory leaks
const SEARCH_STATE_TTL = 24 * 60 * 60 * 1000; // 24 hours
// Limit the number of search states to prevent memory issues
const MAX_SEARCH_STATES = 10;

export const useSortOrderStore = create<SortOrderState>()(
  persist(
    (set, get) => ({
      sortOrder: "desc", // default sort order
      setSortOrder: (sortOrder) => set({ sortOrder }),

      searchStates: {},

      setSearchState: (
        searchQuery: string,
        state: Omit<SearchPaginationState, "timestamp">,
      ) => {
        set((current) => {
          const newState = {
            ...state,
            timestamp: Date.now(),
          };

          const updatedStates = {
            ...current.searchStates,
            [searchQuery]: newState,
          };

          // If we exceed the maximum number of states, remove the oldest ones
          const stateEntries = Object.entries(updatedStates);
          if (stateEntries.length > MAX_SEARCH_STATES) {
            // Sort by timestamp (oldest first) and keep only the most recent ones
            const sortedEntries = stateEntries.sort(
              ([, a], [, b]) => a.timestamp - b.timestamp,
            );
            const recentEntries = sortedEntries.slice(-MAX_SEARCH_STATES);
            const prunedStates = Object.fromEntries(recentEntries);

            return { searchStates: prunedStates };
          }

          return { searchStates: updatedStates };
        });
      },

      getSearchState: (searchQuery: string) => {
        const state = get().searchStates[searchQuery];
        if (!state) return null;

        // Check if state is still valid (not expired)
        if (Date.now() - state.timestamp > SEARCH_STATE_TTL) {
          // Clean up expired state
          set((current) => {
            const { [searchQuery]: _, ...remainingStates } =
              current.searchStates;
            return { searchStates: remainingStates };
          });
          return null;
        }

        return state;
      },

      clearOldSearchStates: () => {
        const now = Date.now();
        set((current) => {
          const validStates: Record<string, SearchPaginationState> = {};

          Object.entries(current.searchStates).forEach(([key, state]) => {
            if (now - state.timestamp <= SEARCH_STATE_TTL) {
              validStates[key] = state;
            }
          });

          return { searchStates: validStates };
        });
      },
    }),
    {
      name: "karakeep-sort-order-store",
      // Only persist sortOrder, not searchStates (they should be session-only)
      partialize: (state) => ({ sortOrder: state.sortOrder }),
    },
  ),
);
