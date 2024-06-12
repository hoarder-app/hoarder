import { useState } from "react";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@radix-ui/react-scroll-area";

import { getAssetFromBookmark } from "@hoarder/shared-react/utils/bookmarkUtils";
import {
  LinkBookmarkAssetTypes,
  ZBookmark,
  ZBookmarkedLink,
} from "@hoarder/shared/types/bookmarks";

function FullPageArchiveSection({ link }: { link: ZBookmarkedLink }) {
  return (
    <iframe
      title={link.url}
      src={`/api/assets/${getAssetFromBookmark(link, LinkBookmarkAssetTypes.FULL_PAGE_ARCHIVE)!.assetId}`}
      className="relative h-full min-w-full"
    />
  );
}

function ScreenshotSection({ link }: { link: ZBookmarkedLink }) {
  return (
    <div className="relative h-full min-w-full">
      <Image
        alt="screenshot"
        src={`/api/assets/${getAssetFromBookmark(link, LinkBookmarkAssetTypes.SCREENSHOT)!.assetId}`}
        width={0}
        height={0}
        sizes="100vw"
        style={{ width: "100%", height: "auto" }}
      />
    </div>
  );
}

function CachedContentSection({ link }: { link: ZBookmarkedLink }) {
  let content;
  if (!link.htmlContent) {
    content = (
      <div className="text-destructive">Failed to fetch link content ...</div>
    );
  } else {
    content = (
      <div
        dangerouslySetInnerHTML={{
          __html: link.htmlContent || "",
        }}
        className="prose mx-auto dark:prose-invert"
      />
    );
  }
  return <ScrollArea className="h-full">{content}</ScrollArea>;
}

export default function LinkContentSection({
  bookmark,
}: {
  bookmark: ZBookmark;
}) {
  const [section, setSection] = useState<string>("cached");

  if (bookmark.content.type != "link") {
    throw new Error("Invalid content type");
  }

  let content;
  if (section === "cached") {
    content = <CachedContentSection link={bookmark.content} />;
  } else if (section === "archive") {
    content = <FullPageArchiveSection link={bookmark.content} />;
  } else {
    content = <ScreenshotSection link={bookmark.content} />;
  }

  return (
    <div className="flex h-full flex-col items-center gap-2">
      <Select onValueChange={setSection} value={section}>
        <SelectTrigger className="w-fit">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="cached">Cached Content</SelectItem>
            <SelectItem
              value="screenshot"
              disabled={
                !getAssetFromBookmark(
                  bookmark.content,
                  LinkBookmarkAssetTypes.SCREENSHOT,
                )
              }
            >
              Screenshot
            </SelectItem>
            <SelectItem
              value="archive"
              disabled={
                !getAssetFromBookmark(
                  bookmark.content,
                  LinkBookmarkAssetTypes.FULL_PAGE_ARCHIVE,
                )
              }
            >
              Archive
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      {content}
    </div>
  );
}
