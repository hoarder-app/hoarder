// reference article https://refine.dev/blog/zustand-react-state/#build-a-to-do-app-using-zustand
import { create } from "zustand";

import type { ZBookmark } from "@hoarder/shared/types/bookmarks";

interface BookmarkState {
  selectedBookmarks: ZBookmark[];
  isBulkEditEnabled: boolean;
  handleBulkEdit: (isEnabled: boolean) => void;
  toggleBookmark: (bookmark: ZBookmark) => void;
  getSelectedBookmarks: () => ZBookmark[];
}

const selectedBookmarksStore = create<BookmarkState>((set, get) => ({
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

  handleBulkEdit: (isEnabled) => {
    set({ isBulkEditEnabled: isEnabled });
    set({ selectedBookmarks: [] });
  },

  getSelectedBookmarks: (): ZBookmark[] => {
    return get().selectedBookmarks;
  },
}));

export default selectedBookmarksStore;
