"use client";

import { createContext, useContext } from "react";

interface LockedListAuthContextType {
  authenticatedLists: Set<string>;
  authenticateList: (listId: string, password: string) => void;
  getAuthenticatedPassword: (listId: string) => string | undefined;
}

const LockedListAuthContext = createContext<
  LockedListAuthContextType | undefined
>(undefined);

export function useLockedListAuth() {
  const context = useContext(LockedListAuthContext);
  if (!context) {
    return {
      authenticatedLists: new Set<string>(),
      authenticateList: () => {
        // No-op when context is not available
      },
      getAuthenticatedPassword: () => undefined,
    };
  }
  return context;
}

export { LockedListAuthContext };
