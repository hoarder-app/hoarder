"use client";

import { BackButton } from "@/components/ui/back-button";
import { Skeleton } from "@/components/ui/skeleton";
import { isBookmarkStillCrawling } from "@/lib/bookmarkUtils";
import { api } from "@/lib/trpc";
import { ZBookmark } from "@hoarder/trpc/types/bookmarks";
import { ArrowLeftCircle, CalendarDays, ExternalLink } from "lucide-react";
import Link from "next/link";
import Markdown from "react-markdown";

export default function BookmarkPreview({
  initialData,
}: {
  initialData: ZBookmark;
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
        if (isBookmarkStillCrawling(data)) {
          return 1000;
        }
        return false;
      },
    },
  );

  const linkHeader = bookmark.content.type == "link" && (
    <div className="flex flex-col space-y-2">
      <p className="text-center text-3xl">
        {bookmark.content.title || bookmark.content.url}
      </p>
      <Link href={bookmark.content.url} className="mx-auto flex gap-2">
        <span className="my-auto">View Original</span>
        <ExternalLink />
      </Link>
    </div>
  );

  let content;
  switch (bookmark.content.type) {
    case "link": {
      if (!bookmark.content.htmlContent) {
        content = (
          <div className="text-red-500">Failed to fetch link content ...</div>
        );
      } else {
        content = (
          <div
            dangerouslySetInnerHTML={{
              __html: bookmark.content.htmlContent || "",
            }}
            className="prose"
          />
        );
      }
      break;
    }
    case "text": {
      content = <Markdown className="prose">{bookmark.content.text}</Markdown>;
      break;
    }
  }

  return (
    <div className="bg-background m-4 min-h-screen space-y-4 rounded-md border p-4">
      <div className="flex justify-between">
        <BackButton className="ghost" variant="ghost">
          <ArrowLeftCircle />
        </BackButton>
        <div className="my-auto">
          <span className="my-auto flex gap-2">
            <CalendarDays /> {bookmark.createdAt.toLocaleString()}
          </span>
        </div>
      </div>
      <hr />
      {linkHeader}
      <div className="mx-auto flex h-full border-x p-2 px-4 lg:w-2/3">
        {isBookmarkStillCrawling(bookmark) ? (
          <div className="flex w-full flex-col gap-2">
            <Skeleton className="h-4" />
            <Skeleton className="h-4" />
            <Skeleton className="h-4" />
          </div>
        ) : (
          content
        )}
      </div>
    </div>
  );
}
