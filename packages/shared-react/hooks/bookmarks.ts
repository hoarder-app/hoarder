import { api } from "../trpc";

export function useDeleteBookmark(
  ...opts: Parameters<typeof api.bookmarks.deleteBookmark.useMutation>
) {
  const apiUtils = api.useUtils();
  return api.bookmarks.deleteBookmark.useMutation({
    ...opts,
    onSuccess: (res, req, meta) => {
      apiUtils.bookmarks.getBookmarks.invalidate();
      apiUtils.bookmarks.searchBookmarks.invalidate();
      opts[0]?.onSuccess?.(res, req, meta);
    },
  });
}

export function useUpdateBookmark(
  ...opts: Parameters<typeof api.bookmarks.updateBookmark.useMutation>
) {
  const apiUtils = api.useUtils();
  return api.bookmarks.updateBookmark.useMutation({
    ...opts,
    onSuccess: (res, req, meta) => {
      apiUtils.bookmarks.getBookmarks.invalidate();
      apiUtils.bookmarks.searchBookmarks.invalidate();
      apiUtils.bookmarks.getBookmark.invalidate({ bookmarkId: req.bookmarkId });
      opts[0]?.onSuccess?.(res, req, meta);
    },
  });
}

export function useRecrawlBookmark(
  ...opts: Parameters<typeof api.bookmarks.recrawlBookmark.useMutation>
) {
  const apiUtils = api.useUtils();
  return api.bookmarks.recrawlBookmark.useMutation({
    ...opts,
    onSuccess: (res, req, meta) => {
      apiUtils.bookmarks.getBookmark.invalidate({ bookmarkId: req.bookmarkId });
      opts[0]?.onSuccess?.(res, req, meta);
    },
  });
}
