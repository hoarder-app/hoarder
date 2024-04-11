import Image from "next/image";

import type { ZBookmark } from "@hoarder/trpc/types/bookmarks";

export function AssetContentSection({ bookmark }: { bookmark: ZBookmark }) {
  if (bookmark.content.type != "asset") {
    throw new Error("Invalid content type");
  }

  let content;
  switch (bookmark.content.assetType) {
    case "image": {
      switch (bookmark.content.assetType) {
        case "image": {
          content = (
            <div className="relative h-full min-w-full">
              <Image
                alt="asset"
                fill={true}
                className="object-contain"
                src={`/api/assets/${bookmark.content.assetId}`}
              />
            </div>
          );
        }
      }
      break;
    }
  }
  return content;
}
