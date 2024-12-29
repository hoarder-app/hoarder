import MarkdownEditor from "@/components/ui/markdown/markdown-editor";
import { MarkdownReadonly } from "@/components/ui/markdown/markdown-readonly";
import { toast } from "@/components/ui/use-toast";

import type { ZBookmarkTypeText } from "@hoarder/shared/types/bookmarks";
import { useUpdateBookmarkText } from "@hoarder/shared-react/hooks/bookmarks";

export function BookmarkMarkdownComponent({
  children: bookmark,
  readOnly = true,
}: {
  children: ZBookmarkTypeText;
  readOnly?: boolean;
}) {
  const { mutate: updateBookmarkMutator, isPending } = useUpdateBookmarkText({
    onSuccess: () => {
      toast({
        description: "Note updated!",
      });
    },
    onError: () => {
      toast({ description: "Something went wrong", variant: "destructive" });
    },
  });

  const onSave = (text: string) => {
    updateBookmarkMutator({
      bookmarkId: bookmark.id,
      text,
    });
  };
  return (
    <div className="h-full overflow-hidden">
      {readOnly ? (
        <MarkdownReadonly>{bookmark.content.text}</MarkdownReadonly>
      ) : (
        <MarkdownEditor onSave={onSave} isSaving={isPending}>
          {bookmark.content.text}
        </MarkdownEditor>
      )}
    </div>
  );
}
