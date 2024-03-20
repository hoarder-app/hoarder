"use client";

import { createContext } from "react";

export const BookmarkListContext = createContext<{
  listId: string | undefined;
}>({ listId: undefined });

export function BookmarkListContextProvider({
  listId,
  children,
}: {
  listId: string;
  children: React.ReactNode;
}) {
  return (
    <BookmarkListContext.Provider value={{ listId }}>
      {children}
    </BookmarkListContext.Provider>
  );
}
