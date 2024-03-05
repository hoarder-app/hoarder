import { ZBookmark } from "@hoarder/trpc/types/bookmarks";

const MAX_LOADING_MSEC = 30 * 1000;

export function isBookmarkStillCrawling(bookmark: ZBookmark) {
  return (
    bookmark.content.type == "link" &&
    !bookmark.content.crawledAt &&
    Date.now().valueOf() - bookmark.createdAt.valueOf() < MAX_LOADING_MSEC
  );
}

export function isBookmarkStillTagging(bookmark: ZBookmark) {
  return (
    bookmark.taggingStatus == "pending" &&
    Date.now().valueOf() - bookmark.createdAt.valueOf() < MAX_LOADING_MSEC
  );
}

export function isBookmarkStillLoading(bookmark: ZBookmark) {
  return isBookmarkStillTagging(bookmark) || isBookmarkStillCrawling(bookmark);
}
