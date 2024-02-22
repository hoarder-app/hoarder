"use client";

import { Badge } from "@/components/ui/badge";
import {
  ImageCard,
  ImageCardBanner,
  ImageCardBody,
  ImageCardContent,
  ImageCardFooter,
  ImageCardTitle,
} from "@/components/ui/imageCard";
import { ZBookmark } from "@/lib/types/api/bookmarks";
import Link from "next/link";
import BookmarkOptions from "./BookmarkOptions";
import { api } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";

function isStillCrawling(bookmark: ZBookmark) {
  return (
    !bookmark.content.crawledAt &&
    Date.now().valueOf() - bookmark.createdAt.valueOf() < 30 * 1000
  );
}

function TagList(bookmark: ZBookmark, stillCrawling: boolean) {
  if (stillCrawling) {
    return (
      <ImageCardBody className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </ImageCardBody>
    );
  }
  return (
    <ImageCardBody className="flex h-full flex-wrap space-x-1 overflow-hidden">
      {bookmark.tags.map((t) => (
        <Link
          className="flex h-full flex-col justify-end"
          key={t.id}
          href={`/dashboard/tags/${t.name}`}
        >
          <Badge
            variant="default"
            className="text-nowrap bg-gray-300 text-gray-500 hover:text-white"
          >
            #{t.name}
          </Badge>
        </Link>
      ))}
    </ImageCardBody>
  );
}

export default function LinkCard({
  bookmark: initialData,
}: {
  bookmark: ZBookmark;
}) {
  const { data: bookmark } = api.bookmarks.getBookmark.useQuery(
    {
      id: initialData.id,
    },
    {
      initialData,
      refetchInterval: (query) => {
        const data = query.state.data;
        if (!data) {
          return false;
        }
        // If the link is not crawled and
        if (isStillCrawling(data)) {
          return 1000;
        }
        return false;
      },
    },
  );
  const link = bookmark.content;
  const isCrawling = isStillCrawling(bookmark);
  const parsedUrl = new URL(link.url);

  // A dummy white pixel for when there's no image.
  // TODO: Better handling for cards with no images
  const image =
    link.imageUrl ??
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAA1JREFUGFdj+P///38ACfsD/QVDRcoAAAAASUVORK5CYII=";

  return (
    <ImageCard
      className={
        "border-grey-100 border bg-gray-50 duration-300 ease-in hover:border-blue-300 hover:transition-all"
      }
    >
      <Link href={link.url}>
        <ImageCardBanner src={isCrawling ? "/blur.avif" : image} />
      </Link>
      <ImageCardContent>
        <ImageCardTitle>
          <Link className="line-clamp-2" href={link.url}>
            {link?.title ?? parsedUrl.host}
          </Link>
        </ImageCardTitle>
        {/* There's a hack here. Every tag has the full hight of the container itself. That why, when we enable flex-wrap,
        the overflowed don't show up. */}
        {TagList(bookmark, isCrawling)}
        <ImageCardFooter>
          <div className="flex justify-between text-gray-500">
            <div className="my-auto">
              <Link className="line-clamp-1 hover:text-black" href={link.url}>
                {parsedUrl.host}
              </Link>
            </div>
            <BookmarkOptions bookmark={bookmark} />
          </div>
        </ImageCardFooter>
      </ImageCardContent>
    </ImageCard>
  );
}
