import {
  BookmarkTypes,
  ZBookmark,
  ZBookmarkedLink,
} from "@hoarder/shared/types/bookmarks";

import { getAssetUrl } from "./assetUtils";

const MAX_LOADING_MSEC = 30 * 1000;

export function getBookmarkLinkImageUrl(bookmark: ZBookmarkedLink) {
  if (bookmark.imageAssetId) {
    return { url: getAssetUrl(bookmark.imageAssetId), localAsset: true };
  }
  if (bookmark.screenshotAssetId) {
    return { url: getAssetUrl(bookmark.screenshotAssetId), localAsset: true };
  }
  return bookmark.imageUrl
    ? { url: bookmark.imageUrl, localAsset: false }
    : null;
}

export function isBookmarkStillCrawling(bookmark: ZBookmark) {
  return (
    bookmark.content.type == BookmarkTypes.LINK &&
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
