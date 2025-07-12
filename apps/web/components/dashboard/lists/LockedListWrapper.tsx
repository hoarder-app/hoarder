"use client";

import { useEffect, useState } from "react";

import { ZBookmarkList } from "@karakeep/shared/types/lists";

import { useLockedListAuth } from "./LockedListAuthContext";
import { LockedListAuthModal } from "./LockedListAuthModal";

interface LockedListWrapperProps {
  list: ZBookmarkList;
  children: React.ReactNode;
}

export function LockedListWrapper({ list, children }: LockedListWrapperProps) {
  const { authenticatedLists, authenticateList } = useLockedListAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const isAuthenticated = authenticatedLists.has(list.id);

  // Initialize auth modal state based on list lock status
  useEffect(() => {
    if (list.locked && !isAuthenticated) {
      setShowAuthModal(true);
    } else {
      setShowAuthModal(false);
    }
  }, [list.locked, isAuthenticated]);

  const handleAuthenticated = (password: string) => {
    authenticateList(list.id, password);
    setShowAuthModal(false);
  };

  // If list is locked and user hasn't authenticated, show the auth modal
  if (list.locked && !isAuthenticated) {
    return (
      <>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="space-y-4 text-center">
            <div className="text-6xl">🔒</div>
            <h2 className="text-xl font-semibold">This list is locked</h2>
            <p className="text-muted-foreground">
              Enter the password to view &quot;{list.name}&quot;
            </p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              Unlock List
            </button>
          </div>
        </div>

        <LockedListAuthModal
          open={showAuthModal}
          onOpenChange={setShowAuthModal}
          listId={list.id}
          listName={list.name}
          onAuthenticated={handleAuthenticated}
        />
      </>
    );
  }

  // If not locked or authenticated, show the actual content with full functionality
  return <>{children}</>;
}
