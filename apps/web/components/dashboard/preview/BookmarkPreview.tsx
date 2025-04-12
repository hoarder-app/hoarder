"use client";

import React from "react";
import Link from "next/link";
import { BookmarkTagsEditor } from "@/components/dashboard/bookmarks/BookmarkTagsEditor";
import { FullPageSpinner } from "@/components/ui/full-page-spinner";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useRelativeTime from "@/lib/hooks/relative-time";
import { useTranslation } from "@/lib/i18n/client";
import { api } from "@/lib/trpc";
import { CalendarDays, ExternalLink } from "lucide-react";

import {
  getBookmarkTitle,
  getSourceUrl,
  isBookmarkStillCrawling,
  isBookmarkStillLoading,
} from "@karakeep/shared-react/utils/bookmarkUtils";
import { BookmarkTypes, ZBookmark } from "@karakeep/shared/types/bookmarks";

import SummarizeBookmarkArea from "../bookmarks/SummarizeBookmarkArea";
import ActionBar from "./ActionBar";
import { AssetContentSection } from "./AssetContentSection";
import AttachmentBox from "./AttachmentBox";
import HighlightsBox from "./HighlightsBox";
import LinkContentSection from "./LinkContentSection";
import { NoteEditor } from "./NoteEditor";
import { TextContentSection } from "./TextContentSection";

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
  const { fromNow, localCreatedAt } = useRelativeTime(createdAt);
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
  const { t } = useTranslation();
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
    case BookmarkTypes.LINK: {
      content = <LinkContentSection bookmark={bookmark} />;
      break;
    }
    case BookmarkTypes.TEXT: {
      content = <TextContentSection bookmark={bookmark} />;
      break;
    }
    case BookmarkTypes.ASSET: {
      content = <AssetContentSection bookmark={bookmark} />;
      break;
    }
  }

  const sourceUrl = getSourceUrl(bookmark);
  const title = getBookmarkTitle(bookmark);

  return (
    <div className="grid h-full grid-rows-3 gap-2 overflow-hidden bg-background lg:grid-cols-3 lg:grid-rows-none">
      <div className="row-span-2 h-full w-full overflow-auto p-2 md:col-span-2 lg:row-auto">
        {isBookmarkStillCrawling(bookmark) ? <ContentLoading /> : content}
      </div>
      <div className="row-span-1  flex flex-col gap-4 overflow-auto bg-accent p-4 md:col-span-2 lg:col-span-1 lg:row-auto">
        <div className="flex w-full flex-col items-center justify-center gap-y-2">
          <div className="flex w-full items-center justify-center gap-2">
            <p className="line-clamp-2 text-ellipsis break-words text-lg">
              {title === undefined || title === "" ? "Untitled" : title}
            </p>
          </div>
          {sourceUrl && (
            <Link
              href={sourceUrl}
              target="_blank"
              className="flex items-center gap-2 text-gray-400"
            >
              <span>{t("preview.view_original")}</span>
              <ExternalLink />
            </Link>
          )}
          <Separator />
        </div>

        <CreationTime createdAt={bookmark.createdAt} />
        <SummarizeBookmarkArea bookmark={bookmark} />
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-400">{t("common.tags")}</p>
          <BookmarkTagsEditor bookmark={bookmark} />
        </div>
        <div className="flex gap-4">
          <p className="pt-2 text-sm text-gray-400">{t("common.note")}</p>
          <NoteEditor bookmark={bookmark} />
        </div>
        <AttachmentBox bookmark={bookmark} />
        <HighlightsBox bookmarkId={bookmark.id} />
        <ActionBar bookmark={bookmark} />
      </div>
    </div>
  );
}
