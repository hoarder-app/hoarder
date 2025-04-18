"use client";

import { createContext, useContext } from "react";

export type BookmarkViewingMode = "public" | "owned" | "shared";

// export const enum BookmarkViewingMode {
//   // The user is viewing a public list.
//   Public = "public",
//   // The user is viewing a list that they own.
//   Owned = "owned",
//   // The user is viewing a list that they don't own but was shared with them.
//   Shared = "shared",
// }

export const BookmarkVieModeContext =
  createContext<BookmarkViewingMode>("owned");

export function BookmarkViewingModeContextProvider({
  mode,
  children,
}: {
  mode: BookmarkViewingMode;
  children: React.ReactNode;
}) {
  return (
    <BookmarkVieModeContext.Provider value={mode}>
      {children}
    </BookmarkVieModeContext.Provider>
  );
}

export function useBookmarkViewingMode() {
  return useContext(BookmarkVieModeContext);
}
