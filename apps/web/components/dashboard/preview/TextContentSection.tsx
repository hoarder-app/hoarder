import Image from "next/image";
import { BookmarkMarkdownComponent } from "@/components/dashboard/bookmarks/BookmarkMarkdownComponent";
import { ScrollArea } from "@radix-ui/react-scroll-area";

import type { ZBookmarkTypeText } from "@karakeep/shared/types/bookmarks";
import { getAssetUrl } from "@karakeep/shared-react/utils/assetUtils";
import { BookmarkTypes, ZBookmark } from "@karakeep/shared/types/bookmarks";

export function TextContentSection({ bookmark }: { bookmark: ZBookmark }) {
  if (bookmark.content.type != BookmarkTypes.TEXT) {
    throw new Error("Invalid content type");
  }
  const banner = bookmark.assets.find(
    (asset) => asset.assetType == "bannerImage",
  );

  return (
    <ScrollArea className="h-full">
      {banner && (
        <div className="relative h-52 min-w-full">
          <Image
            alt="banner"
            src={getAssetUrl(banner.id)}
            width={0}
            height={0}
            layout="fill"
            objectFit="cover"
          />
        </div>
      )}
      <BookmarkMarkdownComponent>
        {bookmark as ZBookmarkTypeText}
      </BookmarkMarkdownComponent>
    </ScrollArea>
  );
}
