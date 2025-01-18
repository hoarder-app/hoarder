import { create } from "zustand";

import type { ZTagBasic } from "@hoarder/shared/types/tags";

interface TagState {
  selectedTags: ZTagBasic[];
  visibleTags: ZTagBasic[];
  isBulkEditEnabled: boolean;
  setIsBulkEditEnabled: (isEnabled: boolean) => void;
  toggleTag: (tag: ZTagBasic) => void;
  setVisibleTags: (visibleTags: ZTagBasic[]) => void;
  selectAll: () => void;
  unSelectAll: () => void;
  isEverythingSelected: () => boolean;
  isTagSelected: (tagId: string) => boolean;
}

const useBulkTagActionsStore = create<TagState>((set, get) => ({
  selectedTags: [],
  visibleTags: [],
  isBulkEditEnabled: false,

  toggleTag: (tag: ZTagBasic) => {
    const selectedTags = get().selectedTags;
    const isTagAlreadySelected = selectedTags.some((b) => b.id === tag.id);
    if (isTagAlreadySelected) {
      set({
        selectedTags: selectedTags.filter((b) => b.id !== tag.id),
      });
    } else {
      set({ selectedTags: [...selectedTags, tag] });
    }
  },

  selectAll: () => {
    set({ selectedTags: get().visibleTags });
  },
  unSelectAll: () => {
    set({ selectedTags: [] });
  },

  isEverythingSelected: () => {
    return get().selectedTags.length === get().visibleTags.length;
  },

  setIsBulkEditEnabled: (isEnabled) => {
    set({ isBulkEditEnabled: isEnabled });
    set({ selectedTags: [] });
  },

  setVisibleTags: (visibleTags: ZTagBasic[]) => {
    set({
      visibleTags,
    });
  },
  isTagSelected: (tagId: string) => {
    return get().selectedTags.some((tag) => tag.id === tagId);
  },
}));

export default useBulkTagActionsStore;
