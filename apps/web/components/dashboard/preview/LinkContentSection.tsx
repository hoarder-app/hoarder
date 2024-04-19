import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@radix-ui/react-scroll-area";

import { ZBookmark, ZBookmarkedLink } from "@hoarder/shared/types/bookmarks";

function ScreenshotSection({ link }: { link: ZBookmarkedLink }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img alt="screenshot" src={`/api/assets/${link.screenshotAssetId}`} />;
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
  return content;
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
  } else {
    content = <ScreenshotSection link={bookmark.content} />;
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Select onValueChange={setSection} value={section}>
        <SelectTrigger className="w-fit">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="cached">Cached Content</SelectItem>
            <SelectItem
              value="screenshot"
              disabled={!bookmark.content.screenshotAssetId}
            >
              Screenshot
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <ScrollArea className="h-full">{content}</ScrollArea>
    </div>
  );
}
