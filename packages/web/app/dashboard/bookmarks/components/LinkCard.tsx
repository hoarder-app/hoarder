"use client";

import {
  ImageCard,
  ImageCardBanner,
  ImageCardBody,
  ImageCardContent,
  ImageCardFooter,
  ImageCardTitle,
} from "@/components/ui/imageCard";
import { ZBookmark } from "@hoarder/trpc/types/bookmarks";
import Link from "next/link";
import BookmarkOptions from "./BookmarkOptions";
import { api } from "@/lib/trpc";
import { Maximize2, Star } from "lucide-react";
import TagList from "./TagList";

function isStillCrawling(bookmark: ZBookmark) {
  return (
    bookmark.content.type == "link" &&
    !bookmark.content.crawledAt &&
    Date.now().valueOf() - bookmark.createdAt.valueOf() < 30 * 1000
  );
}

function isStillTagging(bookmark: ZBookmark) {
  return (
    bookmark.taggingStatus == "pending" &&
    Date.now().valueOf() - bookmark.createdAt.valueOf() < 30 * 1000
  );
}

function isStillLoading(bookmark: ZBookmark) {
  return isStillTagging(bookmark) || isStillCrawling(bookmark);
}

export default function LinkCard({
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
        // If the link is not crawled or not tagged
        if (isStillLoading(data)) {
          return 1000;
        }
        return false;
      },
    },
  );
  const link = bookmark.content;
  if (link.type != "link") {
    throw new Error("Unexpected bookmark type");
  }
  const parsedUrl = new URL(link.url);

  // A dummy white pixel for when there's no image.
  // TODO: Better handling for cards with no images
  const image =
    link.imageUrl ??
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAA1JREFUGFdj+P///38ACfsD/QVDRcoAAAAASUVORK5CYII=";

  return (
    <ImageCard className={className}>
      <Link href={link.url}>
        <ImageCardBanner
          src={isStillCrawling(bookmark) ? "/blur.avif" : image}
        />
      </Link>
      <ImageCardContent>
        <ImageCardTitle>
          <Link className="line-clamp-2" href={link.url} target="_blank">
            {link?.title ?? parsedUrl.host}
          </Link>
        </ImageCardTitle>
        {/* There's a hack here. Every tag has the full hight of the container itself. That why, when we enable flex-wrap,
        the overflowed don't show up. */}
        <ImageCardBody className="flex h-full flex-wrap space-x-1 overflow-hidden">
          <TagList bookmark={bookmark} loading={isStillTagging(bookmark)} />
        </ImageCardBody>
        <ImageCardFooter>
          <div className="mt-1 flex justify-between text-gray-500">
            <div className="my-auto">
              <Link
                className="line-clamp-1 hover:text-black"
                href={link.url}
                target="_blank"
              >
                {parsedUrl.host}
              </Link>
            </div>
            <div className="flex">
              {bookmark.favourited && (
                <Star
                  className="m-1 size-8 rounded p-1"
                  color="#ebb434"
                  fill="#ebb434"
                />
              )}
              <Link
                className="my-auto block px-2"
                href={`/dashboard/preview/${bookmark.id}`}
              >
                <Maximize2 size="20" />
              </Link>
              <BookmarkOptions bookmark={bookmark} />
            </div>
          </div>
        </ImageCardFooter>
      </ImageCardContent>
    </ImageCard>
  );
}
