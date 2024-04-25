import { api } from "../trpc";

export function useDeleteTag(
  ...opts: Parameters<typeof api.tags.delete.useMutation>
) {
  const apiUtils = api.useUtils();

  return api.tags.delete.useMutation({
    ...opts[0],
    onSuccess: (res, req, meta) => {
      apiUtils.tags.list.invalidate();
      apiUtils.bookmarks.getBookmark.invalidate();
      return opts[0]?.onSuccess?.(res, req, meta);
    },
  });
}
