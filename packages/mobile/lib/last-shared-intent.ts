import { create } from "zustand";

interface LastSharedIntent {
  lastIntent: string;
  setIntent: (intent: string) => void;
  isPreviouslyShared: (intent: string) => boolean;
}

export const useLastSharedIntent = create<LastSharedIntent>((set, get) => ({
  lastIntent: "",
  setIntent: (intent: string) => set({ lastIntent: intent }),
  isPreviouslyShared: (intent: string) => {
    return get().lastIntent === intent;
  },
}));
