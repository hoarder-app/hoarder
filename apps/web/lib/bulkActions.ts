// reference article https://refine.dev/blog/zustand-react-state/#build-a-to-do-app-using-zustand
import { create } from "zustand";

import type { ZBookmark } from "@hoarder/shared/types/bookmarks";

interface BookmarkState {
  selectedBookmarks: ZBookmark[];
  visibleBookmarks: ZBookmark[];
  isBulkEditEnabled: boolean;
  setIsBulkEditEnabled: (isEnabled: boolean) => void;
  toggleBookmark: (bookmark: ZBookmark) => void;
  setVisibleBookmarks: (visibleBookmarks: ZBookmark[]) => void;
  selectAll: () => void;
  unSelectAll: () => void;
  isEverythingSelected: () => boolean;
}

const useBulkActionsStore = create<BookmarkState>((set, get) => ({
  selectedBookmarks: [],
  visibleBookmarks: [],
  isBulkEditEnabled: false,

  toggleBookmark: (bookmark: ZBookmark) => {
    const selectedBookmarks = get().selectedBookmarks;
    const isBookmarkAlreadySelected = selectedBookmarks.some(
      (b) => b.id === bookmark.id,
    );
    
    if (isBookmarkAlreadySelected) {
      const newSelectedBookmarks = selectedBookmarks.filter(
        (b) => b.id !== bookmark.id,
      );
      // If this was the last selected bookmark, disable bulk edit mode
      set({
        selectedBookmarks: newSelectedBookmarks,
        isBulkEditEnabled: newSelectedBookmarks.length > 0
      });
    } else {
      // If this is the first selected bookmark, enable bulk edit mode
      set({ 
        selectedBookmarks: [...selectedBookmarks, bookmark],
        isBulkEditEnabled: true
      });
    }
  },

  selectAll: () => {
    set({ selectedBookmarks: get().visibleBookmarks });
  },
  unSelectAll: () => {
    set({ selectedBookmarks: [] });
  },

  isEverythingSelected: () => {
    return get().selectedBookmarks.length === get().visibleBookmarks.length;
  },

  setIsBulkEditEnabled: (isEnabled) => {
    set({ isBulkEditEnabled: isEnabled });
    set({ selectedBookmarks: [] });
  },

  setVisibleBookmarks: (visibleBookmarks: ZBookmark[]) => {
    set({
      visibleBookmarks,
    });
  },
}));

export default useBulkActionsStore;
