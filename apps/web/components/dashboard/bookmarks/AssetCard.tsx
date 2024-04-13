"use client";

import Image from "next/image";
import { isBookmarkStillTagging } from "@/lib/bookmarkUtils";
import { api } from "@/lib/trpc";

import type {
  ZBookmark,
  ZBookmarkTypeAsset,
} from "@hoarder/trpc/types/bookmarks";

import { BookmarkLayoutAdaptingCard } from "./BookmarkLayoutAdaptingCard";

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
        <Image
          alt="asset"
          src={`/api/assets/${bookmarkedAsset.assetId}`}
          fill={true}
          className={className}
        />
      );
    }
    case "pdf": {
      return (
        <iframe
          title={bookmarkedAsset.assetId}
          className={className}
          src={`/api/assets/${bookmarkedAsset.assetId}`}
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
  bookmark: initialData,
  className,
}: {
  bookmark: ZBookmark;
  className?: string;
}) {
  const { data: bookmark } = api.bookmarks.getBookmark.useQuery(
    {
      bookmarkId: initialData.id,
    },
    {
      initialData,
      refetchInterval: (query) => {
        const data = query.state.data;
        if (!data) {
          return false;
        }
        if (isBookmarkStillTagging(data)) {
          return 1000;
        }
        return false;
      },
    },
  );

  if (bookmark.content.type != "asset") {
    throw new Error("Unexpected bookmark type");
  }

  const bookmarkedAsset = { ...bookmark, content: bookmark.content };

  return (
    <BookmarkLayoutAdaptingCard
      title={bookmarkedAsset.content.fileName}
      footer={null}
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
