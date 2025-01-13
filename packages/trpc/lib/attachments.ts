import { z } from "zod";

import { AssetTypes } from "@hoarder/db/schema";
import { ZAssetType, zAssetTypesSchema } from "@hoarder/shared/types/bookmarks";

export function mapDBAssetTypeToUserType(assetType: AssetTypes): ZAssetType {
  const map: Record<AssetTypes, z.infer<typeof zAssetTypesSchema>> = {
    [AssetTypes.LINK_SCREENSHOT]: "screenshot",
    [AssetTypes.LINK_FULL_PAGE_ARCHIVE]: "fullPageArchive",
    [AssetTypes.LINK_PRECRAWLED_ARCHIVE]: "precrawledArchive",
    [AssetTypes.LINK_BANNER_IMAGE]: "bannerImage",
    [AssetTypes.LINK_VIDEO]: "video",
    [AssetTypes.BOOKMARK_ASSET]: "bookmarkAsset",
    [AssetTypes.UNKNOWN]: "bannerImage",
  };
  return map[assetType];
}

export function mapSchemaAssetTypeToDB(
  assetType: z.infer<typeof zAssetTypesSchema>,
): AssetTypes {
  const map: Record<ZAssetType, AssetTypes> = {
    screenshot: AssetTypes.LINK_SCREENSHOT,
    fullPageArchive: AssetTypes.LINK_FULL_PAGE_ARCHIVE,
    precrawledArchive: AssetTypes.LINK_PRECRAWLED_ARCHIVE,
    bannerImage: AssetTypes.LINK_BANNER_IMAGE,
    video: AssetTypes.LINK_VIDEO,
    bookmarkAsset: AssetTypes.BOOKMARK_ASSET,
    unknown: AssetTypes.UNKNOWN,
  };
  return map[assetType];
}

export function humanFriendlyNameForAssertType(type: ZAssetType) {
  const map: Record<ZAssetType, string> = {
    screenshot: "Screenshot",
    fullPageArchive: "Full Page Archive",
    precrawledArchive: "Precrawled Archive",
    bannerImage: "Banner Image",
    video: "Video",
    bookmarkAsset: "Bookmark Asset",
    unknown: "Unknown",
  };
  return map[type];
}

export function isAllowedToAttachAsset(type: ZAssetType) {
  const map: Record<ZAssetType, boolean> = {
    screenshot: true,
    fullPageArchive: false,
    precrawledArchive: false,
    bannerImage: true,
    video: false,
    bookmarkAsset: false,
    unknown: false,
  };
  return map[type];
}

export function isAllowedToDetachAsset(type: ZAssetType) {
  const map: Record<ZAssetType, boolean> = {
    screenshot: true,
    fullPageArchive: true,
    precrawledArchive: false,
    bannerImage: true,
    video: true,
    bookmarkAsset: false,
    unknown: false,
  };
  return map[type];
}
