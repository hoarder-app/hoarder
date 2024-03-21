"use client";

import Image from "next/image";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  isBookmarkStillCrawling,
  isBookmarkStillLoading,
} from "@/lib/bookmarkUtils";
import { api } from "@/lib/trpc";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { CalendarDays, ExternalLink } from "lucide-react";
import Markdown from "react-markdown";

import type { ZBookmark } from "@hoarder/trpc/types/bookmarks";

import { TagsEditor } from "./TagsEditor";

dayjs.extend(relativeTime);

function ContentLoading() {
  return (
    <div className="flex w-full flex-col gap-2">
      <Skeleton className="h-4" />
      <Skeleton className="h-4" />
      <Skeleton className="h-4" />
    </div>
  );
}

function CreationTime({ createdAt }: { createdAt: Date }) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <span className="flex w-fit gap-2">
            <CalendarDays /> {dayjs(createdAt).fromNow()}
          </span>
        </TooltipTrigger>
        <TooltipContent>{createdAt.toLocaleString()}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function LinkHeader({ bookmark }: { bookmark: ZBookmark }) {
  if (bookmark.content.type !== "link") {
    throw new Error("Unexpected content type");
  }

  const title = bookmark.content.title ?? bookmark.content.url;

  return (
    <div className="flex w-full flex-col items-center justify-center space-y-3">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <p className="line-clamp-2 text-center text-lg">{title}</p>
          </TooltipTrigger>
          <TooltipPortal>
            <TooltipContent side="bottom" className="w-96">
              {title}
            </TooltipContent>
          </TooltipPortal>
        </Tooltip>
      </TooltipProvider>
      <Link
        href={bookmark.content.url}
        className="mx-auto flex gap-2 text-gray-400"
      >
        <span className="my-auto">View Original</span>
        <ExternalLink />
      </Link>
      <hr />
    </div>
  );
}

function TextContentSection({ bookmark }: { bookmark: ZBookmark }) {
  let content;
  switch (bookmark.content.type) {
    case "link": {
      if (!bookmark.content.htmlContent) {
        content = (
          <div className="text-destructive">
            Failed to fetch link content ...
          </div>
        );
      } else {
        content = (
          <div
            dangerouslySetInnerHTML={{
              __html: bookmark.content.htmlContent || "",
            }}
            className="prose mx-auto"
          />
        );
      }
      break;
    }
    case "text": {
      content = (
        <Markdown className="prose mx-auto">{bookmark.content.text}</Markdown>
      );
      break;
    }
  }

  return <ScrollArea className="h-full">{content}</ScrollArea>;
}

function AssetContentSection({ bookmark }: { bookmark: ZBookmark }) {
  if (bookmark.content.type != "asset") {
    throw new Error("Invalid content type");
  }

  let content;
  switch (bookmark.content.assetType) {
    case "image": {
      switch (bookmark.content.assetType) {
        case "image": {
          content = (
            <div className="relative h-full min-w-full">
              <Image
                alt="asset"
                fill={true}
                className="object-contain"
                src={`/api/assets/${bookmark.content.assetId}`}
              />
            </div>
          );
        }
      }
      break;
    }
  }
  return content;
}

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
        if (isBookmarkStillLoading(data)) {
          return 1000;
        }
        return false;
      },
    },
  );

  let content;
  switch (bookmark.content.type) {
    case "link":
    case "text": {
      content = <TextContentSection bookmark={bookmark} />;
      break;
    }
    case "asset": {
      content = <AssetContentSection bookmark={bookmark} />;
      break;
    }
  }

  const linkHeader = bookmark.content.type == "link" && (
    <LinkHeader bookmark={bookmark} />
  );

  return (
    <div className="grid grid-rows-3 gap-2 overflow-hidden bg-background lg:grid-cols-3 lg:grid-rows-none">
      <div className="row-span-2 h-full w-full overflow-hidden p-2 md:col-span-2 lg:row-auto">
        {isBookmarkStillCrawling(bookmark) ? <ContentLoading /> : content}
      </div>
      <div className="lg:col-span1 row-span-1 flex flex-col gap-4 bg-gray-100 p-4 lg:row-auto">
        {linkHeader}
        <CreationTime createdAt={bookmark.createdAt} />
        <div className="flex gap-2">
          <TagsEditor bookmark={bookmark} />
        </div>
      </div>
    </div>
  );
}
