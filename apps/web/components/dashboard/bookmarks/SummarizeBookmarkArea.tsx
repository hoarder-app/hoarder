import React from "react";
import { ActionButton } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/spinner";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  Trash2,
} from "lucide-react";

import {
  useSummarizeBookmark,
  useUpdateBookmark,
} from "@hoarder/shared-react/hooks/bookmarks";
import { BookmarkTypes, ZBookmark } from "@hoarder/shared/types/bookmarks";

function AISummary({
  bookmarkId,
  summary,
}: {
  bookmarkId: string;
  summary: string;
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const { mutate: resummarize, isPending: isResummarizing } =
    useSummarizeBookmark({
      onError: () => {
        toast({
          description: "Something went wrong",
          variant: "destructive",
        });
      },
    });
  const { mutate: updateBookmark, isPending: isUpdatingBookmark } =
    useUpdateBookmark({
      onError: () => {
        toast({
          description: "Something went wrong",
          variant: "destructive",
        });
      },
    });
  return (
    <div className="w-full p-1">
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        className={`
          relative overflow-hidden rounded-lg p-4
          transition-all duration-300 ease-in-out
          ${isExpanded ? "h-auto" : "h-[4.5em] cursor-pointer"}
          bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 p-[2px]
        `}
        onClick={() => !isExpanded && setIsExpanded(true)}
      >
        <div className="h-full rounded-lg bg-background p-3">
          <p
            className={`text-sm text-gray-700 dark:text-gray-300 ${!isExpanded && "line-clamp-3"}`}
          >
            {summary}
          </p>
          {!isExpanded && (
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent dark:from-gray-800" />
          )}
          <span className="absolute bottom-2 right-2 flex gap-2">
            {isExpanded && (
              <>
                <ActionButton
                  variant="none"
                  size="none"
                  spinner={<LoadingSpinner className="size-4" />}
                  className="rounded-full bg-gray-200 p-1 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                  aria-label={isExpanded ? "Collapse" : "Expand"}
                  loading={isResummarizing}
                  onClick={() => resummarize({ bookmarkId })}
                >
                  <RefreshCw size={16} />
                </ActionButton>
                <ActionButton
                  size="none"
                  variant="none"
                  spinner={<LoadingSpinner className="size-4" />}
                  className="rounded-full bg-gray-200 p-1 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                  aria-label={isExpanded ? "Collapse" : "Expand"}
                  loading={isUpdatingBookmark}
                  onClick={() => updateBookmark({ bookmarkId, summary: null })}
                >
                  <Trash2 size={16} />
                </ActionButton>
              </>
            )}
            <button
              className="rounded-full bg-gray-200 p-1 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
              aria-label={isExpanded ? "Collapse" : "Expand"}
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}

export default function SummarizeBookmarkArea({
  bookmark,
}: {
  bookmark: ZBookmark;
}) {
  const { mutate, isPending } = useSummarizeBookmark({
    onError: () => {
      toast({
        description: "Something went wrong",
        variant: "destructive",
      });
    },
  });

  if (bookmark.content.type !== BookmarkTypes.LINK) {
    return null;
  }

  if (bookmark.summary) {
    return <AISummary bookmarkId={bookmark.id} summary={bookmark.summary} />;
  } else {
    return (
      <div className="flex w-full items-center gap-4">
        <Button
          onClick={() => mutate({ bookmarkId: bookmark.id })}
          className={cn(
            `relative w-full overflow-hidden bg-opacity-30 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 transition-all duration-300`,
            isPending ? "text-transparent" : "text-gray-300",
          )}
          disabled={isPending}
        >
          {isPending && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-gradient-x background-animate h-full w-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500"></div>
              <Loader2 className="absolute h-5 w-5 animate-spin text-white" />
            </div>
          )}
          <span className="relative z-10">Summarize with AI</span>
        </Button>
      </div>
    );
  }
}
