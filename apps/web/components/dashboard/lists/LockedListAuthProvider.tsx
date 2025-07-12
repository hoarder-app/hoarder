"use client";

import { useCallback, useState } from "react";

import { LockedListAuthContext } from "./LockedListAuthContext";

interface LockedListAuthProviderProps {
  children: React.ReactNode;
}

export function LockedListAuthProvider({
  children,
}: LockedListAuthProviderProps) {
  const [authenticatedLists, setAuthenticatedLists] = useState<Set<string>>(
    new Set(),
  );
  const [listPasswords, setListPasswords] = useState<Map<string, string>>(
    new Map(),
  );

  const authenticateList = useCallback((listId: string, password: string) => {
    setAuthenticatedLists((prev) => new Set(prev).add(listId));
    setListPasswords((prev) => new Map(prev).set(listId, password));
  }, []);

  const getAuthenticatedPassword = useCallback(
    (listId: string) => {
      return listPasswords.get(listId);
    },
    [listPasswords],
  );

  const value = {
    authenticatedLists,
    authenticateList,
    getAuthenticatedPassword,
  };

  return (
    <LockedListAuthContext.Provider value={value}>
      {children}
    </LockedListAuthContext.Provider>
  );
}
