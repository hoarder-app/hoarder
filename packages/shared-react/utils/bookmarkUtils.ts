import {
  LinkBookmarkAssetTypes,
  ZBookmark,
  ZBookmarkedLink,
  zLinkBookmarkAsset,
} from "@hoarder/shared/types/bookmarks";

import { getAssetUrl } from "./assetUtils";

const MAX_LOADING_MSEC = 30 * 1000;

/**
 * @param bookmark the bookmark to get the asset information from
 * @param assetType which asset information should be returned
 * @returns the information for the specified assetType or undefined
 */
export function getAssetFromBookmark(
  bookmark: ZBookmarkedLink,
  assetType: LinkBookmarkAssetTypes,
): zLinkBookmarkAsset | undefined {
  return bookmark.linkBookmarkAssets?.find(
    (asset) => asset.assetType === assetType,
  );
}

/**
 * Retrieves the ImageUrl for a link bookmark, depending on which assets are available
 * @param bookmark the bookmark to get the ImageUrl from
 */
export function getBookmarkLinkImageUrl(bookmark: ZBookmarkedLink) {
  const imageAsset = getAssetFromBookmark(
    bookmark,
    LinkBookmarkAssetTypes.IMAGE,
  );
  if (imageAsset) {
    return { url: getAssetUrl(imageAsset.assetId), localAsset: true };
  }
  const screenshotAsset = getAssetFromBookmark(
    bookmark,
    LinkBookmarkAssetTypes.SCREENSHOT,
  );
  if (screenshotAsset) {
    return { url: getAssetUrl(screenshotAsset.assetId), localAsset: true };
  }
  return bookmark.imageUrl
    ? { url: bookmark.imageUrl, localAsset: false }
    : null;
}

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
