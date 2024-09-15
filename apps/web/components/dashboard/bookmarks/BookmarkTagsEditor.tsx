import { toast } from "@/components/ui/use-toast";

import type { ZBookmark } from "@hoarder/shared/types/bookmarks";
import { useUpdateBookmarkTags } from "@hoarder/shared-react/hooks/bookmarks";

import { TagsEditor } from "./TagsEditor";

export function BookmarkTagsEditor({ bookmark }: { bookmark: ZBookmark }) {
  const { mutate } = useUpdateBookmarkTags({
    onSuccess: () => {
      toast({
        description: "Tags has been updated!",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "There was a problem with your request.",
      });
    },
  });

  return (
    <TagsEditor
      tags={bookmark.tags}
      onAttach={({ tagName, tagId }) => {
        mutate({
          bookmarkId: bookmark.id,
          attach: [
            {
              tagName,
              tagId,
            },
          ],
          detach: [],
        });
      }}
      onDetach={({ tagId }) => {
        mutate({
          bookmarkId: bookmark.id,
          attach: [],
          detach: [{ tagId }],
        });
      }}
    />
  );
}
