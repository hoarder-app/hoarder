import { ScrollArea } from "@radix-ui/react-scroll-area";
import Markdown from "react-markdown";

import type { ZBookmark } from "@hoarder/trpc/types/bookmarks";

export function TextContentSection({ bookmark }: { bookmark: ZBookmark }) {
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
            className="prose mx-auto dark:prose-invert"
          />
        );
      }
      break;
    }
    case "text": {
      content = (
        <Markdown className="prose mx-auto dark:prose-invert">
          {bookmark.content.text}
        </Markdown>
      );
      break;
    }
  }

  return <ScrollArea className="h-full">{content}</ScrollArea>;
}
