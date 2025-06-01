"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import BookmarkFormattedCreatedAt from "@/components/dashboard/bookmarks/BookmarkFormattedCreatedAt";
import FooterLinkURL from "@/components/dashboard/bookmarks/FooterLinkURL";
import { ActionButton } from "@/components/ui/action-button";
import { badgeVariants } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import tailwindConfig from "@/tailwind.config";
import { FileIcon, FileText, ImageIcon } from "lucide-react";
import { useInView } from "react-intersection-observer";
import Masonry from "react-masonry-css";
import resolveConfig from "tailwindcss/resolveConfig";

import {
  BookmarkTypes,
  ZPublicBookmark,
} from "@karakeep/shared/types/bookmarks";
import { ZCursor } from "@karakeep/shared/types/pagination";

function TagPill({ tag }: { tag: string }) {
  return (
    <div
      className={cn(
        badgeVariants({ variant: "secondary" }),
        "text-nowrap font-light text-gray-700 hover:bg-foreground hover:text-secondary dark:text-gray-400",
      )}
      key={tag}
    >
      {tag}
    </div>
  );
}

function BookmarkCard({ bookmark }: { bookmark: ZPublicBookmark }) {
  const renderContent = () => {
    switch (bookmark.content.type) {
      case BookmarkTypes.LINK:
        return (
          <div className="space-y-2">
            {bookmark.bannerImageUrl && (
              <div className="aspect-video w-full overflow-hidden rounded bg-gray-100">
                <Link href={bookmark.content.url} target="_blank">
                  <img
                    src={bookmark.bannerImageUrl}
                    alt={bookmark.title ?? "Link preview"}
                    className="h-full w-full object-cover"
                  />
                </Link>
              </div>
            )}
            <div className="space-y-2">
              <Link
                href={bookmark.content.url}
                target="_blank"
                className="line-clamp-2 text-ellipsis text-lg font-medium leading-tight text-gray-900"
              >
                {bookmark.title}
              </Link>
            </div>
          </div>
        );

      case BookmarkTypes.TEXT:
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-500">
              <FileText className="h-3 w-3" />
              <span className="text-xs font-medium">Note</span>
            </div>
            {bookmark.title && (
              <h3 className="text-sm font-medium leading-tight text-gray-900">
                {bookmark.title}
              </h3>
            )}
            <p className="line-clamp-4 text-xs leading-relaxed text-gray-600">
              {bookmark.content.text}
            </p>
          </div>
        );

      case BookmarkTypes.ASSET:
        return (
          <div className="space-y-2">
            {bookmark.bannerImageUrl ? (
              <div className="aspect-video w-full overflow-hidden rounded bg-gray-100">
                <Link href={bookmark.content.assetUrl}>
                  <img
                    src={bookmark.bannerImageUrl}
                    alt={bookmark.title ?? "Asset preview"}
                    className="h-full w-full object-cover"
                  />
                </Link>
              </div>
            ) : (
              <div className="flex aspect-video w-full items-center justify-center overflow-hidden rounded bg-gray-100">
                {bookmark.content.assetType === "image" ? (
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                ) : (
                  <FileIcon className="h-8 w-8 text-gray-400" />
                )}
              </div>
            )}
            <div className="space-y-1">
              <Link
                href={bookmark.content.assetUrl}
                target="_blank"
                className="line-clamp-2 text-ellipsis text-lg font-medium leading-tight text-gray-900"
              >
                {bookmark.title}
              </Link>
            </div>
          </div>
        );
    }
  };

  return (
    <Card className="group mb-3 border-0 shadow-sm transition-all duration-200 hover:shadow-lg">
      <CardContent className="p-3">
        {renderContent()}

        {/* Tags */}
        {bookmark.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {bookmark.tags.map((tag, index) => (
              <TagPill key={index} tag={tag} />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {bookmark.content.type === BookmarkTypes.LINK && (
              <>
                <FooterLinkURL url={bookmark.content.url} />
                <span>•</span>
              </>
            )}
            <BookmarkFormattedCreatedAt createdAt={bookmark.createdAt} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getBreakpointConfig() {
  const fullConfig = resolveConfig(tailwindConfig);

  const breakpointColumnsObj: { [key: number]: number; default: number } = {
    default: 3,
  };
  breakpointColumnsObj[parseInt(fullConfig.theme.screens.lg)] = 2;
  breakpointColumnsObj[parseInt(fullConfig.theme.screens.md)] = 1;
  breakpointColumnsObj[parseInt(fullConfig.theme.screens.sm)] = 1;
  return breakpointColumnsObj;
}

export default function PublicBookmarkGrid({
  bookmarks: initialBookmarks,
  nextCursor,
  list,
}: {
  list: {
    id: string;
    name: string;
    description: string | null | undefined;
    icon: string;
    numItems: number;
  };
  bookmarks: ZPublicBookmark[];
  nextCursor: ZCursor | null;
}) {
  const { ref: loadMoreRef, inView: loadMoreButtonInView } = useInView();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    api.publicBookmarks.getPublicBookmarksInList.useInfiniteQuery(
      { listId: list.id },
      {
        initialData: () => ({
          pages: [{ bookmarks: initialBookmarks, nextCursor, list }],
          pageParams: [null],
        }),
        initialCursor: null,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        refetchOnMount: true,
      },
    );

  useEffect(() => {
    if (loadMoreButtonInView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [loadMoreButtonInView]);

  const breakpointConfig = useMemo(() => getBreakpointConfig(), []);

  const bookmarks = useMemo(() => {
    return data.pages.flatMap((b) => b.bookmarks);
  }, [data]);
  return (
    <>
      <Masonry className="flex gap-4" breakpointCols={breakpointConfig}>
        {bookmarks.map((bookmark) => (
          <BookmarkCard key={bookmark.id} bookmark={bookmark} />
        ))}
      </Masonry>
      {hasNextPage && (
        <div className="flex justify-center">
          <ActionButton
            ref={loadMoreRef}
            ignoreDemoMode={true}
            loading={isFetchingNextPage}
            onClick={() => fetchNextPage()}
            variant="ghost"
          >
            Load More
          </ActionButton>
        </div>
      )}
    </>
  );
}
