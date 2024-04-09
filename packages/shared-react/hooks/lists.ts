import { api } from "../trpc";

export function useAddBookmarkToList(
  ...opts: Parameters<typeof api.lists.addToList.useMutation>
) {
  const apiUtils = api.useUtils();
  return api.lists.addToList.useMutation({
    ...opts,
    onSuccess: (res, req, meta) => {
      apiUtils.bookmarks.getBookmarks.invalidate({ listId: req.listId });
      return opts[0]?.onSuccess?.(res, req, meta);
    },
  });
}

export function useRemoveBookmarkFromList(
  ...opts: Parameters<typeof api.lists.removeFromList.useMutation>
) {
  const apiUtils = api.useUtils();
  return api.lists.removeFromList.useMutation({
    ...opts,
    onSuccess: (res, req, meta) => {
      apiUtils.bookmarks.getBookmarks.invalidate({ listId: req.listId });
      return opts[0]?.onSuccess?.(res, req, meta);
    },
  });
}
