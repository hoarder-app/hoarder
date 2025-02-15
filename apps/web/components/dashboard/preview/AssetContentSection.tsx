import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { BookmarkTypes, ZBookmark } from "@hoarder/shared/types/bookmarks";

// 20 MB
const BIG_FILE_SIZE = 20 * 1024 * 1024;

export function AssetContentSection({ bookmark }: { bookmark: ZBookmark }) {
  const initialSection = useMemo(() => {
    if (
      bookmark.content.type !== BookmarkTypes.ASSET ||
      bookmark.content.assetType !== "pdf"
    ) {
      return "";
    }
    const screenshot = bookmark.assets.find(
      (item) => item.assetType === "screenshot",
    );
    const bigSize =
      bookmark.content.size && bookmark.content.size > BIG_FILE_SIZE;
    if (bigSize && screenshot) {
      return "screenshot";
    }
    return "pdf";
  }, [bookmark]);

  const [section, setSection] = useState(initialSection);

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
    const screenshot = bookmark.content.screenshotAssetId;
    const content =
      section === "screenshot" && screenshot ? (
        <div className="relative h-full min-w-full">
          <Image
            alt="screenshot"
            src={`/api/assets/${screenshot}`}
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
        <div className="flex w-full items-center justify-center gap-4">
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
          <Link
            className={cn(
              buttonVariants({ variant: "link" }),
              "flex gap-2 rounded-md p-3",
            )}
            target="_blank"
            rel="noreferrer"
            href={`/api/assets/${bookmark.content.assetId}`}
            download={bookmark.content.fileName}
          >
            Download PDF
          </Link>
        </div>
        {content}
      </div>
    );
  }

  return <div>Unsupported asset type</div>;
}
