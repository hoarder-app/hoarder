"use client";

import Image from "next/image";
import Link from "next/link";

import type { ZBookmarkTypeAsset } from "@hoarder/shared/types/bookmarks";
import { getAssetUrl } from "@hoarder/shared-react/utils/assetUtils";
import {
  getSourceUrl,
  isBookmarkStillTagging,
} from "@hoarder/shared-react/utils/bookmarkUtils";

import { BookmarkLayoutAdaptingCard } from "./BookmarkLayoutAdaptingCard";
import FooterLinkURL from "./FooterLinkURL";

function AssetImage({
  bookmark,
  className,
}: {
  bookmark: ZBookmarkTypeAsset;
  className?: string;
}) {
  const bookmarkedAsset = bookmark.content;
  switch (bookmarkedAsset.assetType) {
    case "image": {
      return (
        <Link href={`/dashboard/preview/${bookmark.id}`}>
          <Image
            alt="asset"
            src={getAssetUrl(bookmarkedAsset.assetId)}
            fill={true}
            className={className}
          />
        </Link>
      );
    }
    case "pdf": {
      const screenshot = bookmark.assets.find(
        (item) => item.assetType === "screenshot",
      );
      if (screenshot) {
        return (
          <Link href={`/dashboard/preview/${bookmark.id}`}>
            <Image
              alt="asset"
              src={getAssetUrl(screenshot.id)}
              fill={true}
              className={className}
            />
          </Link>
        );
      } else {
        return (
          <div>
            <div className="mb-2 text-red-400">
              {!isBookmarkStillTagging(bookmark) && (
                <p className="m-2">
                  Please contact your administrator to perform a compact assets
                  action to generate PDF screenshots by visiting{" "}
                  <Link href="/admin/actions" className="underline">
                    admin/actions
                  </Link>
                </p>
              )}
            </div>
            <iframe
              title={bookmarkedAsset.assetId}
              className={className}
              src={getAssetUrl(bookmarkedAsset.assetId)}
            />
          </div>
        );
      }
    }
    default: {
      const _exhaustiveCheck: never = bookmarkedAsset.assetType;
      return <span />;
    }
  }
}

export default function AssetCard({
  bookmark: bookmarkedAsset,
  className,
}: {
  bookmark: ZBookmarkTypeAsset;
  className?: string;
}) {
  return (
    <BookmarkLayoutAdaptingCard
      title={bookmarkedAsset.title ?? bookmarkedAsset.content.fileName}
      footer={
        getSourceUrl(bookmarkedAsset) && (
          <FooterLinkURL url={getSourceUrl(bookmarkedAsset)} />
        )
      }
      bookmark={bookmarkedAsset}
      className={className}
      wrapTags={true}
      image={(_layout, className) => (
        <div className="relative size-full flex-1">
          <AssetImage bookmark={bookmarkedAsset} className={className} />
        </div>
      )}
    />
  );
}
