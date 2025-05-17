"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSwipeable } from "react-swipeable";
import { BookmarkTagsEditor } from "@/components/dashboard/bookmarks/BookmarkTagsEditor";
import { FullPageSpinner } from "@/components/ui/full-page-spinner";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [activeTab, setActiveTab] = useState<string>("content");
  const [showTabBar, setShowTabBar] = useState<boolean>(true);
  const lastScrollY = useRef<number>(0);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (activeTab === "content") {
        setActiveTab("details");
      }
    },
    onSwipedRight: () => {
      if (activeTab === "details") {
        setActiveTab("content");
      }
    },
    trackMouse: true,
    preventScrollOnSwipe: true,
  });

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
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="flex h-full w-full flex-col overflow-hidden"
    >
      <TabsList 
        className={`grid w-full grid-cols-2 transition-transform duration-300 ${
          showTabBar ? 'translate-y-0' : '-translate-y-full'
        } sticky top-0 z-10`}
      >
        <TabsTrigger value="content">
          {t("preview.tabs.content", "Content")}
        </TabsTrigger>
        <TabsTrigger value="details">
          {t("preview.tabs.details", "Details")}
        </TabsTrigger>
      </TabsList>
      <div 
        {...swipeHandlers} 
        className="flex-1 overflow-hidden"
      >
        {/* Changed: wrapper for swipe */}
        <TabsContent
          value="content"
          className="h-full overflow-y-auto p-2 data-[state=inactive]:hidden"
          /* Changed: h-full instead of flex-1 */
          onScroll={(e) => {
            const currentScrollY = e.currentTarget.scrollTop;
            if (currentScrollY > lastScrollY.current && currentScrollY > 10) {
              setShowTabBar(false);
            } else {
              setShowTabBar(true);
            }
            lastScrollY.current = currentScrollY;
          }}
        >
          {isBookmarkStillCrawling(bookmark) ? <ContentLoading /> : content}
        </TabsContent>
        <TabsContent
          value="details"
          className="h-full overflow-y-auto bg-accent p-4 data-[state=inactive]:hidden"
          /* Changed: h-full instead of flex-1 */
          onScroll={(e) => {
            const currentScrollY = e.currentTarget.scrollTop;
            if (currentScrollY > lastScrollY.current && currentScrollY > 10) {
              setShowTabBar(false);
            } else {
              setShowTabBar(true);
            }
            lastScrollY.current = currentScrollY;
          }}
        >
          <div className="flex flex-col gap-4">
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
      </TabsContent>
      </div>
      {/* Changed: closing tag for swipe wrapper */}
    </Tabs>
  );
}
