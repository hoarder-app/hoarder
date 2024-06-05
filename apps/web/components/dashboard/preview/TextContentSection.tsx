import { MarkdownComponent } from "@/components/ui/markdown-component";
import { ScrollArea } from "@radix-ui/react-scroll-area";

import type { ZBookmark } from "@hoarder/shared/types/bookmarks";

export function TextContentSection({ bookmark }: { bookmark: ZBookmark }) {
  if (bookmark.content.type != "text") {
    throw new Error("Invalid content type");
  }
  return (
    <ScrollArea className="h-full">
      <MarkdownComponent>{bookmark.content.text}</MarkdownComponent>
    </ScrollArea>
  );
}
