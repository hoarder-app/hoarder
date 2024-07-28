"use client";

import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { useTheme } from "next-themes";

import type { ZBookmarkTypeLink } from "@hoarder/shared/types/bookmarks";
import {
  getBookmarkLinkImageUrl,
  isBookmarkStillCrawling,
} from "@hoarder/shared-react/utils/bookmarkUtils";

import { BookmarkLayoutAdaptingCard } from "./BookmarkLayoutAdaptingCard";

function LinkTitle({ bookmark }: { bookmark: ZBookmarkTypeLink }) {
  const link = bookmark.content;
  const parsedUrl = new URL(link.url);
  return (
    <Link href={link.url} target="_blank" className="">
      {bookmark.title ?? link?.title ?? parsedUrl.host}
    </Link>
  );
}

function LinkImage({
  bookmark,
  className,
}: {
  bookmark: ZBookmarkTypeLink;
  className?: string;
}) {
  const link = bookmark.content;
  const isYouTubeLink =
    link.url.includes("youtube.com") || link.url.includes("youtu.be");

  const imgComponent = (url: string, unoptimized: boolean) => (
    <Image
      unoptimized={unoptimized}
      className={className}
      alt="card banner"
      fill={true}
      src={url}
    />
  );

  const imageDetails = getBookmarkLinkImageUrl(link);

  let img: React.ReactNode = null;
  if (isBookmarkStillCrawling(bookmark)) {
    img = imgComponent("/blur.avif", false);
  } else if (imageDetails) {
    img = imgComponent(imageDetails.url, !imageDetails.localAsset);
  } else {
    // No image found
    // A dummy white pixel for when there's no image.
    img = imgComponent(
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAA1JREFUGFdj+P///38ACfsD/QVDRcoAAAAASUVORK5CYII=",
      true,
    );
  }

  return (
    <Link href={link.url} target="_blank" className={className}>
      <div className="group relative size-full flex-1">
        {img}
        {isYouTubeLink && (
          // Play icon overlay
          <div className="absolute inset-0 flex items-center justify-center">
            <Play className="h-16 w-16 transform text-white opacity-80 transition-transform group-hover:scale-125 group-hover:font-extrabold" />
          </div>
        )}
      </div>
    </Link>
  );
}

function LinkUrl({ bookmark }: { bookmark: ZBookmarkTypeLink }) {
  const link = bookmark.content;
  const parsedUrl = new URL(link.url);
  return (
    <Link
      className="line-clamp-1 text-gray-400 hover:text-foreground"
      href={link.url}
      target="_blank"
    >
      {parsedUrl.host}
    </Link>
  );
}

export default function LinkCard({
  bookmark: bookmarkLink,
  className,
}: {
  bookmark: ZBookmarkTypeLink;
  className?: string;
}) {
  const { theme } = useTheme();

  const themeClass =
    theme === "dark"
      ? "bg-gray-800 text-white border-gray-700 opacity-90 hover:opacity-100"
      : "bg-white text-gray-900 border-gray-300 opacity-90 hover:opacity-100";

  return (
    <BookmarkLayoutAdaptingCard
      title={<LinkTitle bookmark={bookmarkLink} />}
      footer={<LinkUrl bookmark={bookmarkLink} />}
      bookmark={bookmarkLink}
      wrapTags={false}
      image={(_layout, className) => (
        <LinkImage className={className} bookmark={bookmarkLink} />
      )}
      className={`${className} ${themeClass}`}
    />
  );
}
