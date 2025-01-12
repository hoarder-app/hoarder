import { create } from "zustand";

import { ZSortOrder } from "@hoarder/shared/types/bookmarks";

interface SortOrderState {
  sortOrder: ZSortOrder;
  setSortOrder: (sortOrder: ZSortOrder) => void;
}

export const useSortOrderStore = create<SortOrderState>((set) => ({
  sortOrder: "desc", // default sort order
  setSortOrder: (sortOrder) => set({ sortOrder }),
}));
