import { ZBookmarkList } from "@hoarder/shared/types/lists";
import {
  listsToTree,
  ZBookmarkListRoot,
} from "@hoarder/shared/utils/listUtils";

import { api } from "../trpc";

export function useCreateBookmarkList(
  ...opts: Parameters<typeof api.lists.create.useMutation>
) {
  const apiUtils = api.useUtils();
  return api.lists.create.useMutation({
    ...opts[0],
    onSuccess: (res, req, meta) => {
      apiUtils.lists.list.invalidate();
      return opts[0]?.onSuccess?.(res, req, meta);
    },
  });
}

export function useEditBookmarkList(
  ...opts: Parameters<typeof api.lists.edit.useMutation>
) {
  const apiUtils = api.useUtils();
  return api.lists.edit.useMutation({
    ...opts[0],
    onSuccess: (res, req, meta) => {
      apiUtils.lists.list.invalidate();
      apiUtils.lists.get.invalidate({ listId: req.listId });
      return opts[0]?.onSuccess?.(res, req, meta);
    },
  });
}

export function useAddBookmarkToList(
  ...opts: Parameters<typeof api.lists.addToList.useMutation>
) {
  const apiUtils = api.useUtils();
  return api.lists.addToList.useMutation({
    ...opts[0],
    onSuccess: (res, req, meta) => {
      apiUtils.bookmarks.getBookmarks.invalidate({ listId: req.listId });
      apiUtils.lists.getListsOfBookmark.invalidate({
        bookmarkId: req.bookmarkId,
      });
      return opts[0]?.onSuccess?.(res, req, meta);
    },
  });
}

export function useRemoveBookmarkFromList(
  ...opts: Parameters<typeof api.lists.removeFromList.useMutation>
) {
  const apiUtils = api.useUtils();
  return api.lists.removeFromList.useMutation({
    ...opts[0],
    onSuccess: (res, req, meta) => {
      apiUtils.bookmarks.getBookmarks.invalidate({ listId: req.listId });
      apiUtils.lists.getListsOfBookmark.invalidate({
        bookmarkId: req.bookmarkId,
      });
      return opts[0]?.onSuccess?.(res, req, meta);
    },
  });
}

export function useDeleteBookmarkList(
  ...opts: Parameters<typeof api.lists.delete.useMutation>
) {
  const apiUtils = api.useUtils();
  return api.lists.delete.useMutation({
    ...opts[0],
    onSuccess: (res, req, meta) => {
      apiUtils.lists.list.invalidate();
      apiUtils.lists.get.invalidate({ listId: req.listId });
      return opts[0]?.onSuccess?.(res, req, meta);
    },
  });
}

export function useBookmarkLists(
  ...opts: Parameters<typeof api.lists.list.useQuery>
) {
  return api.lists.list.useQuery(opts[0], {
    ...opts[1],
    select: (data) => {
      return { data: data.lists, ...listsToTree(data.lists) };
    },
  });
}

export function augmentBookmarkListsWithInitialData(
  data:
    | {
        data: ZBookmarkList[];
        root: ZBookmarkListRoot;
        allPaths: ZBookmarkList[][];
        getPathById: (id: string) => ZBookmarkList[] | undefined;
      }
    | undefined,
  initialData: ZBookmarkList[],
) {
  if (data) {
    return data;
  }
  return { data: initialData, ...listsToTree(initialData) };
}
