import { useSortOrderStore } from "../store/useSortOrderStore";

export function useSortOrder() {
  const sortOrder = useSortOrderStore((state) => state.sortOrder);
  const setSortOrder = useSortOrderStore((state) => state.setSortOrder);
  return { sortOrder, setSortOrder };
}
