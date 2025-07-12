"use client";

import { useLockedListAuth } from "@/components/dashboard/lists/LockedListAuthContext";

import { useBookmarkGridContext } from "@karakeep/shared-react/hooks/bookmark-grid-context";
import {
  useCreateBookmarkWithCustomPostHook,
  useUpdateBookmark,
  useUpdateBookmarkTags,
} from "@karakeep/shared-react/hooks/bookmarks";
import { useAddBookmarkToList } from "@karakeep/shared-react/hooks/lists";
import { api } from "@karakeep/shared-react/trpc";

/**
 * Web app specific version of useBookmarkPostCreationHook that handles locked list authentication
 */
export function useBookmarkPostCreationHook() {
  const gridQueryCtx = useBookmarkGridContext();
  const { mutateAsync: updateBookmark } = useUpdateBookmark();
  const { mutateAsync: addToList } = useAddBookmarkToList();
  const { mutateAsync: updateTags } = useUpdateBookmarkTags();
  const { getAuthenticatedPassword } = useLockedListAuth();

  return async (bookmarkId: string) => {
    if (!gridQueryCtx) {
      return;
    }

    const promises = [];
    if (gridQueryCtx.favourited ?? gridQueryCtx.archived) {
      promises.push(
        updateBookmark({
          bookmarkId,
          favourited: gridQueryCtx.favourited,
          archived: gridQueryCtx.archived,
        }),
      );
    }

    if (gridQueryCtx.listId) {
      const password = getAuthenticatedPassword(gridQueryCtx.listId);
      promises.push(
        addToList({
          bookmarkId,
          listId: gridQueryCtx.listId,
          password,
        }),
      );
    }

    if (gridQueryCtx.tagId) {
      promises.push(
        updateTags({
          bookmarkId,
          attach: [{ tagId: gridQueryCtx.tagId }],
          detach: [],
        }),
      );
    }

    await Promise.all(promises);
  };
}

/**
 * Web app specific version of useCreateBookmarkWithPostHook that handles locked list authentication
 */
export function useCreateBookmarkWithPostHook(
  ...opts: Parameters<typeof api.bookmarks.createBookmark.useMutation>
) {
  return useCreateBookmarkWithCustomPostHook(
    useBookmarkPostCreationHook,
    ...opts,
  );
}
