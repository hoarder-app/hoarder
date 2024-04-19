import { ScrollArea } from "@radix-ui/react-scroll-area";
import Markdown from "react-markdown";

import type { ZBookmark } from "@hoarder/shared/types/bookmarks";

export function TextContentSection({ bookmark }: { bookmark: ZBookmark }) {
  if (bookmark.content.type != "text") {
    throw new Error("Invalid content type");
  }
  return (
    <ScrollArea className="h-full">
      <Markdown className="prose mx-auto dark:prose-invert">
        {bookmark.content.text}
      </Markdown>
    </ScrollArea>
  );
}
