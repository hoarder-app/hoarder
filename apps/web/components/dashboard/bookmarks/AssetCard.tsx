"use client";

import Link from "next/link";

import type { ZBookmarkTypeAsset } from "@hoarder/shared/types/bookmarks";
import { getAssetUrl } from "@hoarder/shared-react/utils/assetUtils";
import { getSourceUrl } from "@hoarder/shared-react/utils/bookmarkUtils";

import { BookmarkLayoutAdaptingCard } from "./BookmarkLayoutAdaptingCard";
import FixedRatioImage from "./FixedRatioImage";
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
          <FixedRatioImage
            src={getAssetUrl(bookmarkedAsset.assetId)}
            unoptimized={true}
            className="max-h-screen w-full rounded-t-lg object-cover"
            alt="asset"
          />
        </Link>
      );
    }
    case "pdf": {
      return (
        <iframe
          title={bookmarkedAsset.assetId}
          className={className}
          src={getAssetUrl(bookmarkedAsset.assetId)}
        />
      );
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
