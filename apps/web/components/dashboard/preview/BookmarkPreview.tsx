"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TagsEditor } from "@/components/dashboard/bookmarks/TagsEditor";
import { FullPageSpinner } from "@/components/ui/full-page-spinner";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/lib/trpc";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { CalendarDays, ExternalLink } from "lucide-react";

import type { ZBookmark } from "@hoarder/shared/types/bookmarks";
import {
  isBookmarkStillCrawling,
  isBookmarkStillLoading,
} from "@hoarder/shared-react/utils/bookmarkUtils";

import ActionBar from "./ActionBar";
import { AssetContentSection } from "./AssetContentSection";
import { EditableTitle } from "./EditableTitle";
import LinkContentSection from "./LinkContentSection";
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
  const [fromNow, setFromNow] = useState("");
  const [localCreatedAt, setLocalCreatedAt] = useState("");

  // This is to avoid hydration errors when server and clients are in different timezones
  useEffect(() => {
    setFromNow(dayjs(createdAt).fromNow());
    setLocalCreatedAt(createdAt.toLocaleString());
  }, [createdAt]);
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <span className="flex w-fit gap-2">
          <CalendarDays /> {fromNow}
        </span>
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent>{localCreatedAt}</TooltipContent>
      </TooltipPortal>
    </Tooltip>
  );
}

export default function BookmarkPreview({
  bookmarkId,
  initialData,
}: {
  bookmarkId: string;
  initialData?: ZBookmark;
}) {
  const { data: bookmark } = api.bookmarks.getBookmark.useQuery(
    {
      bookmarkId,
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

  if (!bookmark) {
    return <FullPageSpinner />;
  }

  let content;
  switch (bookmark.content.type) {
    case "link": {
      content = <LinkContentSection bookmark={bookmark} />;
      break;
    }
    case "text": {
      content = <TextContentSection bookmark={bookmark} />;
      break;
    }
    case "asset": {
      content = <AssetContentSection bookmark={bookmark} />;
      break;
    }
  }

  return (
    <div className="grid h-full grid-rows-3 gap-2 overflow-hidden bg-background lg:grid-cols-3 lg:grid-rows-none">
      <div className="row-span-2 h-full w-full overflow-auto p-2 md:col-span-2 lg:row-auto">
        {isBookmarkStillCrawling(bookmark) ? <ContentLoading /> : content}
      </div>
      <div className="lg:col-span1 row-span-1 flex flex-col gap-4 overflow-auto bg-accent p-4 lg:row-auto">
        <div className="flex w-full flex-col items-center justify-center gap-y-2">
          <EditableTitle bookmark={bookmark} />
          {bookmark.content.type == "link" && (
            <Link
              href={bookmark.content.url}
              className="flex items-center gap-2 text-gray-400"
            >
              <span>View Original</span>
              <ExternalLink />
            </Link>
          )}
          <Separator />
        </div>

        <CreationTime createdAt={bookmark.createdAt} />
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-400">Tags</p>
          <TagsEditor bookmark={bookmark} />
        </div>
        <div className="flex gap-4">
          <p className="pt-2 text-sm text-gray-400">Note</p>
          <NoteEditor bookmark={bookmark} />
        </div>
        <ActionBar bookmark={bookmark} />
      </div>
    </div>
  );
}
