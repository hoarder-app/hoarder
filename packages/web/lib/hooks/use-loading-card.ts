import { create } from "zustand";

export const useLoadingCard = create<{
  loading: boolean,
  setLoading: (val: boolean) => void,
}>((set) => ({
  loading: false,
  setLoading: (val: boolean) => set({ loading: val }),
}));
