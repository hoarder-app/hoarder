"use client";

import { useState, useRef, useEffect } from "react";
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
  const [showTabBar, setShowTabBar] = useState(true);
  const [isWideScreen, setIsWideScreen] = useState(true);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const lastScrollY = useRef<number>(0);
  const isScrollingRef = useRef<boolean>(false);
  const scrollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check screen width and touch capability on mount and resize
  useEffect(() => {
    const checkScreenLayout = () => {
      // Consider wide screen if width > height (landscape) or width > certain threshold
      const isWide = window.innerWidth > Math.max(window.innerHeight, 900);
      setIsWideScreen(isWide);
    };

    const checkTouchDevice = () => {
      // Check if device supports touch
      setIsTouchDevice(
        'ontouchstart' in window || 
        navigator.maxTouchPoints > 0 || 
        (navigator as any).msMaxTouchPoints > 0
      );
    };

    // Initial check
    checkScreenLayout();
    checkTouchDevice();

    // Set up resize listener
    window.addEventListener('resize', checkScreenLayout);
    
    return () => {
      window.removeEventListener('resize', checkScreenLayout);
    };
  }, []);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (!isWideScreen && activeTab === "content") {
        setActiveTab("details");
      }
    },
    onSwipedRight: () => {
      if (!isWideScreen && activeTab === "details") {
        setActiveTab("content");
      }
    },
    trackMouse: false,
    preventScrollOnSwipe: true,
    // Disable swipe completely if we're in wide screen layout
    disabled: isWideScreen || !isTouchDevice,
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

  // Scroll handler for tabbed layout
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isWideScreen) return;
    
    const currentScrollY = e.currentTarget.scrollTop;
    const scrollHeight = e.currentTarget.scrollHeight;
    const clientHeight = e.currentTarget.clientHeight;
    const isAtBottom = scrollHeight - currentScrollY - clientHeight < 10;
    
    // Significant scroll distance to avoid micro-scrolls
    const scrollDifference = Math.abs(currentScrollY - lastScrollY.current);
    const isSignificantScroll = scrollDifference > 5;
    
    // Only process significant scrolls and ignore bounces at the bottom
    if (isSignificantScroll && !isAtBottom) {
      if (currentScrollY > lastScrollY.current && currentScrollY > 10) {
        setShowTabBar(false);
      } else {
        setShowTabBar(true);
      }
    } else if (isAtBottom) {
      // Keep tab bar hidden at the bottom to avoid bouncing
      setShowTabBar(false);
    }
    
    // Update the scroll position reference
    lastScrollY.current = currentScrollY;
    
    // Set a debounce for scroll ending
    isScrollingRef.current = true;
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 150);
  };

  // Common content for both layouts
  const contentSection = isBookmarkStillCrawling(bookmark) ? <ContentLoading /> : content;
  
  const detailsSection = (
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
  );

  // Render original layout for wide screens
  if (isWideScreen) {
    return (
      <div className="grid h-full grid-cols-3 overflow-hidden bg-background">
        <div className="col-span-2 h-full w-full overflow-auto p-2">
          {contentSection}
        </div>
        <div className="flex flex-col gap-4 overflow-auto bg-accent p-4">
          {detailsSection}
        </div>
      </div>
    );
  }

  // Render tabbed layout for narrow/vertical screens
  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="flex h-full w-full flex-col overflow-hidden"
    >
      <div className="sticky top-0 z-10 h-auto">
        <TabsList 
          className={`grid w-full grid-cols-2 transition-transform duration-300 ${
            showTabBar ? 'translate-y-0' : '-translate-y-full'
          }`}
        >
          <TabsTrigger value="content">
            {t("preview.tabs.content", "Content")}
          </TabsTrigger>
          <TabsTrigger value="details">
            {t("preview.tabs.details", "Details")}
          </TabsTrigger>
        </TabsList>
      </div>
      <div 
        {...swipeHandlers} 
        className={`flex-1 overflow-hidden transition-all duration-300 ${
          showTabBar ? '' : '-mt-[var(--tab-height)]'
        }`}
        style={{ '--tab-height': '41px' } as React.CSSProperties}
      >
        <TabsContent
          value="content"
          className="h-full overflow-y-auto p-2 data-[state=inactive]:hidden"
          onScroll={handleScroll}
        >
          {contentSection}
        </TabsContent>
        <TabsContent
          value="details"
          className="h-full overflow-y-auto bg-accent p-4 data-[state=inactive]:hidden"
          onScroll={handleScroll}
        >
          {detailsSection}
        </TabsContent>
      </div>
    </Tabs>
  );
}
