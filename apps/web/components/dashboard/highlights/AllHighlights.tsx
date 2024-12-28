"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ActionButton } from "@/components/ui/action-button";
import useRelativeTime from "@/lib/hooks/relative-time";
import { api } from "@/lib/trpc";
import { Separator } from "@radix-ui/react-dropdown-menu";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Dot, LinkIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useInView } from "react-intersection-observer";

import {
  ZGetAllHighlightsResponse,
  ZHighlight,
} from "@hoarder/shared/types/highlights";

import HighlightCard from "./HighlightCard";

dayjs.extend(relativeTime);

function Highlight({ highlight }: { highlight: ZHighlight }) {
  const { fromNow, localCreatedAt } = useRelativeTime(highlight.createdAt);
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2">
      <HighlightCard highlight={highlight} clickable={false} />
      <span className="flex items-center gap-0.5 text-xs italic text-gray-400">
        <span title={localCreatedAt}>{fromNow}</span>
        <Dot />
        <Link
          href={`/dashboard/preview/${highlight.bookmarkId}`}
          className="flex items-center gap-0.5"
        >
          <LinkIcon className="size-3 italic" />
          {t("common.source")}
        </Link>
      </span>
    </div>
  );
}

export default function AllHighlights({
  highlights: initialHighlights,
}: {
  highlights: ZGetAllHighlightsResponse;
}) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    api.highlights.getAll.useInfiniteQuery(
      {},
      {
        initialData: () => ({
          pages: [initialHighlights],
          pageParams: [null],
        }),
        initialCursor: null,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    );

  const { ref: loadMoreRef, inView: loadMoreButtonInView } = useInView();
  useEffect(() => {
    if (loadMoreButtonInView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [loadMoreButtonInView]);

  return (
    <div className="flex flex-col gap-2">
      {data?.pages
        .flatMap((p) => p.highlights)
        .map((h) => (
          <>
            <Highlight key={h.id} highlight={h} />
            <Separator
              key={`sep-${h.id}`}
              className="m-2 h-0.5 bg-gray-100 last:hidden"
            />
          </>
        ))}
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
    </div>
  );
}
