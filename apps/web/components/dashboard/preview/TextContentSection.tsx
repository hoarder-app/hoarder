import Image from "next/image";
import { MarkdownComponent } from "@/components/ui/markdown-component";
import { ScrollArea } from "@radix-ui/react-scroll-area";

import { getAssetUrl } from "@hoarder/shared-react/utils/assetUtils";
import { BookmarkTypes, ZBookmark } from "@hoarder/shared/types/bookmarks";

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
      <MarkdownComponent>{bookmark.content.text}</MarkdownComponent>
    </ScrollArea>
  );
}
