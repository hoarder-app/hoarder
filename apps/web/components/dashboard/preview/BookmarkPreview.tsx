"use client";

import Link from "next/link";
import { TagsEditor } from "@/components/dashboard/bookmarks/TagsEditor";
import { Separator } from "@/components/ui/separator";
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

import type { ZBookmark } from "@hoarder/trpc/types/bookmarks";

import ActionBar from "./ActionBar";
import { AssetContentSection } from "./AssetContentSection";
import { NoteEditor } from "./NoteEditor";
import { TextContentSection } from "./TextContentSection";

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
        <TooltipPortal>
          <TooltipContent>{createdAt.toLocaleString()}</TooltipContent>
        </TooltipPortal>
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
      <Separator />
    </div>
  );
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
      <div className="lg:col-span1 row-span-1 flex flex-col gap-4 overflow-auto bg-accent p-4 lg:row-auto">
        {linkHeader}
        <CreationTime createdAt={bookmark.createdAt} />
        <div className="flex gap-4">
          <p className="text-sm text-gray-400">Tags</p>
          <TagsEditor bookmark={bookmark} />
        </div>
        <div className="flex gap-4">
          <p className="text-sm text-gray-400">Note</p>
          <NoteEditor bookmark={bookmark} />
        </div>
        <ActionBar bookmark={bookmark} />
      </div>
    </div>
  );
}
