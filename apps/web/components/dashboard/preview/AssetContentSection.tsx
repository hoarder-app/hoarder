import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { BookmarkTypes, ZBookmark } from "@hoarder/shared/types/bookmarks";

export function AssetContentSection({ bookmark }: { bookmark: ZBookmark }) {
  const [section, setSection] = useState<string>("");

  useEffect(() => {
    const screenshot = bookmark.assets.find(
      (item) => item.assetType === "screenshot",
    );
    if (screenshot) {
      setSection("screenshot");
    } else {
      setSection("pdf");
    }
  }, [bookmark]);

  if (bookmark.content.type != BookmarkTypes.ASSET) {
    throw new Error("Invalid content type");
  }

  if (bookmark.content.assetType === "image") {
    return (
      <div className="relative h-full min-w-full">
        <Link href={`/api/assets/${bookmark.content.assetId}`} target="_blank">
          <Image
            alt="asset"
            fill={true}
            className="object-contain"
            src={`/api/assets/${bookmark.content.assetId}`}
          />
        </Link>
      </div>
    );
  }

  if (bookmark.content.assetType === "pdf") {
    const screenshot = bookmark.assets.find(
      (item) => item.assetType === "screenshot",
    );

    const content =
      section === "screenshot" && screenshot ? (
        <div className="relative h-full min-w-full">
          <Image
            alt="screenshot"
            src={`/api/assets/${screenshot.id}`}
            fill={true}
            className="object-contain"
          />
        </div>
      ) : (
        <iframe
          title={bookmark.content.assetId}
          className="h-full w-full"
          src={`/api/assets/${bookmark.content.assetId}`}
        />
      );

    return (
      <div className="flex h-full flex-col items-center gap-2">
        <Select onValueChange={setSection} value={section}>
          <SelectTrigger className="w-fit">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="screenshot" disabled={!screenshot}>
                Screenshot
              </SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        {content}
      </div>
    );
  }

  return <div>Unsupported asset type</div>;
}
