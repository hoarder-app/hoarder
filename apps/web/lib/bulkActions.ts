// reference article https://refine.dev/blog/zustand-react-state/#build-a-to-do-app-using-zustand
import { create } from "zustand";

import type { ZBookmark } from "@hoarder/shared/types/bookmarks";

interface BookmarkState {
  selectedBookmarks: ZBookmark[];
  isBulkEditEnabled: boolean;
  setIsBulkEditEnabled: (isEnabled: boolean) => void;
  toggleBookmark: (bookmark: ZBookmark) => void;
}

const useBulkActionsStore = create<BookmarkState>((set, get) => ({
  selectedBookmarks: [],
  isBulkEditEnabled: false,

  toggleBookmark: (bookmark: ZBookmark) => {
    const selectedBookmarks = get().selectedBookmarks;
    const isBookmarkAlreadySelected = selectedBookmarks.some(
      (b) => b.id === bookmark.id,
    );
    if (isBookmarkAlreadySelected) {
      set({
        selectedBookmarks: selectedBookmarks.filter(
          (b) => b.id !== bookmark.id,
        ),
      });
    } else {
      set({ selectedBookmarks: [...selectedBookmarks, bookmark] });
    }
  },

  setIsBulkEditEnabled: (isEnabled) => {
    set({ isBulkEditEnabled: isEnabled });
    set({ selectedBookmarks: [] });
  },
}));

export default useBulkActionsStore;
