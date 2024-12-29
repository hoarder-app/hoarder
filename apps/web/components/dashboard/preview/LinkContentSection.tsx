import { useState } from "react";
import Image from "next/image";
import BookmarkHTMLHighlighter from "@/components/dashboard/preview/BookmarkHtmlHighlighter";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useTranslation } from "@/lib/i18n/client";
import { api } from "@/lib/trpc";
import { ScrollArea } from "@radix-ui/react-scroll-area";

import {
  useCreateHighlight,
  useDeleteHighlight,
  useUpdateHighlight,
} from "@hoarder/shared-react/hooks/highlights";
import {
  BookmarkTypes,
  ZBookmark,
  ZBookmarkedLink,
} from "@hoarder/shared/types/bookmarks";

function FullPageArchiveSection({ link }: { link: ZBookmarkedLink }) {
  return (
    <iframe
      title={link.url}
      src={`/api/assets/${link.fullPageArchiveAssetId}`}
      className="relative h-full min-w-full"
    />
  );
}

function ScreenshotSection({ link }: { link: ZBookmarkedLink }) {
  return (
    <div className="relative h-full min-w-full">
      <Image
        alt="screenshot"
        src={`/api/assets/${link.screenshotAssetId}`}
        width={0}
        height={0}
        sizes="100vw"
        style={{ width: "100%", height: "auto" }}
      />
    </div>
  );
}

function CachedContentSection({
  bookmarkId,
  link,
}: {
  bookmarkId: string;
  link: ZBookmarkedLink;
}) {
  const { data } = api.highlights.getForBookmark.useQuery({
    bookmarkId,
  });

  const { mutate: createHighlight } = useCreateHighlight({
    onSuccess: () => {
      toast({
        description: "Highlight has been created!",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        description: "Something went wrong",
      });
    },
  });

  const { mutate: updateHighlight } = useUpdateHighlight({
    onSuccess: () => {
      toast({
        description: "Highlight has been updated!",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        description: "Something went wrong",
      });
    },
  });

  const { mutate: deleteHighlight } = useDeleteHighlight({
    onSuccess: () => {
      toast({
        description: "Highlight has been deleted!",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        description: "Something went wrong",
      });
    },
  });

  let content;
  if (!link.htmlContent) {
    content = (
      <div className="text-destructive">Failed to fetch link content ...</div>
    );
  } else {
    content = (
      <BookmarkHTMLHighlighter
        htmlContent={link.htmlContent || ""}
        className="prose mx-auto dark:prose-invert"
        highlights={data?.highlights ?? []}
        onDeleteHighlight={(h) =>
          deleteHighlight({
            highlightId: h.id,
          })
        }
        onUpdateHighlight={(h) =>
          updateHighlight({
            highlightId: h.id,
            color: h.color,
          })
        }
        onHighlight={(h) =>
          createHighlight({
            startOffset: h.startOffset,
            endOffset: h.endOffset,
            color: h.color,
            bookmarkId,
            text: h.text,
            note: null,
          })
        }
      />
    );
  }
  return <ScrollArea className="h-full">{content}</ScrollArea>;
}

function VideoSection({ link }: { link: ZBookmarkedLink }) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-0 h-full w-full">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption -- captions not (yet) available */}
        <video className="m-auto max-h-full max-w-full" controls>
          <source src={`/api/assets/${link.videoAssetId}`} />
          Not supported by your browser
        </video>
      </div>
    </div>
  );
}

export default function LinkContentSection({
  bookmark,
}: {
  bookmark: ZBookmark;
}) {
  const { t } = useTranslation();
  const [section, setSection] = useState<string>("cached");

  if (bookmark.content.type != BookmarkTypes.LINK) {
    throw new Error("Invalid content type");
  }

  let content;
  if (section === "cached") {
    content = (
      <CachedContentSection bookmarkId={bookmark.id} link={bookmark.content} />
    );
  } else if (section === "archive") {
    content = <FullPageArchiveSection link={bookmark.content} />;
  } else if (section === "video") {
    content = <VideoSection link={bookmark.content} />;
  } else {
    content = <ScreenshotSection link={bookmark.content} />;
  }

  return (
    <div className="flex h-full flex-col items-center gap-2">
      <Select onValueChange={setSection} value={section}>
        <SelectTrigger className="w-fit">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="cached">
              {t("preview.cached_content")}
            </SelectItem>
            <SelectItem
              value="screenshot"
              disabled={!bookmark.content.screenshotAssetId}
            >
              {t("common.screenshot")}
            </SelectItem>
            <SelectItem
              value="archive"
              disabled={!bookmark.content.fullPageArchiveAssetId}
            >
              {t("common.archive")}
            </SelectItem>
            <SelectItem value="video" disabled={!bookmark.content.videoAssetId}>
              {t("common.video")}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      {content}
    </div>
  );
}
