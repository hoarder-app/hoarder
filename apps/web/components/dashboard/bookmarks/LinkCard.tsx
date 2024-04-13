"use client";

import Link from "next/link";
import {
  isBookmarkStillCrawling,
  isBookmarkStillLoading,
} from "@/lib/bookmarkUtils";
import { api } from "@/lib/trpc";

import type { ZBookmarkTypeLink } from "@hoarder/trpc/types/bookmarks";

import { BookmarkLayoutAdaptingCard } from "./BookmarkLayoutAdaptingCard";

function LinkTitle({ bookmark }: { bookmark: ZBookmarkTypeLink }) {
  const link = bookmark.content;
  const parsedUrl = new URL(link.url);
  return (
    <Link className="line-clamp-2" href={link.url} target="_blank">
      {link?.title ?? parsedUrl.host}
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

  // A dummy white pixel for when there's no image.
  // TODO: Better handling for cards with no images
  const image =
    link.imageUrl ??
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAA1JREFUGFdj+P///38ACfsD/QVDRcoAAAAASUVORK5CYII=";
  return (
    <Link href={link.url} target="_blank">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={className}
        alt="card banner"
        src={isBookmarkStillCrawling(bookmark) ? "/blur.avif" : image}
      />
    </Link>
  );
}

function LinkUrl({ bookmark }: { bookmark: ZBookmarkTypeLink }) {
  const link = bookmark.content;
  const parsedUrl = new URL(link.url);
  return (
    <Link
      className="line-clamp-1 hover:text-foreground"
      href={link.url}
      target="_blank"
    >
      {parsedUrl.host}
    </Link>
  );
}

export default function LinkCard({
  bookmark: initialData,
  className,
}: {
  bookmark: ZBookmarkTypeLink;
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
        // If the link is not crawled or not tagged
        if (isBookmarkStillLoading(data)) {
          return 1000;
        }
        return false;
      },
    },
  );

  if (bookmark.content.type !== "link") {
    throw new Error("Invalid bookmark type");
  }

  const bookmarkLink = { ...bookmark, content: bookmark.content };

  return (
    <BookmarkLayoutAdaptingCard
      title={<LinkTitle bookmark={bookmarkLink} />}
      footer={<LinkUrl bookmark={bookmarkLink} />}
      bookmark={bookmarkLink}
      wrapTags={false}
      image={(_layout, className) => (
        <LinkImage className={className} bookmark={bookmarkLink} />
      )}
      className={className}
    />
  );
}
