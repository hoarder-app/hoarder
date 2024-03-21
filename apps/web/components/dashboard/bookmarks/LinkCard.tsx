"use client";

import Link from "next/link";
import {
  ImageCard,
  ImageCardBanner,
  ImageCardBody,
  ImageCardContent,
  ImageCardFooter,
  ImageCardTitle,
} from "@/components/ui/imageCard";
import {
  isBookmarkStillCrawling,
  isBookmarkStillLoading,
  isBookmarkStillTagging,
} from "@/lib/bookmarkUtils";
import { api } from "@/lib/trpc";

import type { ZBookmark } from "@hoarder/trpc/types/bookmarks";

import BookmarkActionBar from "./BookmarkActionBar";
import TagList from "./TagList";

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
        if (isBookmarkStillLoading(data)) {
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
      <Link href={link.url} target="_blank">
        <ImageCardBanner
          src={isBookmarkStillCrawling(bookmark) ? "/blur.avif" : image}
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
          <TagList
            bookmark={bookmark}
            loading={isBookmarkStillTagging(bookmark)}
          />
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
            <BookmarkActionBar bookmark={bookmark} />
          </div>
        </ImageCardFooter>
      </ImageCardContent>
    </ImageCard>
  );
}
