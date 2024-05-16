import { toast } from "@/components/ui/use-toast";

import { useUpdateBookmark } from "@hoarder/shared-react/hooks/bookmarks";
import { ZBookmark } from "@hoarder/shared/types/bookmarks";

import { EditableText } from "../EditableText";

export function EditableTitle({ bookmark }: { bookmark: ZBookmark }) {
  const { mutate: updateBookmark, isPending } = useUpdateBookmark({
    onSuccess: () => {
      toast({
        description: "Title updated!",
      });
    },
  });

  let title: string | null = null;
  switch (bookmark.content.type) {
    case "link":
      title = bookmark.content.title ?? bookmark.content.url;
      break;
    case "text":
      title = null;
      break;
    case "asset":
      title = bookmark.content.fileName ?? null;
      break;
  }

  title = bookmark.title ?? title;
  if (title == "") {
    title = null;
  }

  return (
    <EditableText
      originalText={title}
      editClassName="p-2 text-lg break-all"
      viewClassName="break-words line-clamp-2 text-lg text-ellipsis"
      untitledClassName="text-lg italic text-gray-600"
      onSave={(newTitle) => {
        updateBookmark(
          {
            bookmarkId: bookmark.id,
            title: newTitle,
          },
          {
            onError: () => {
              toast({
                description: "Something went wrong",
                variant: "destructive",
              });
            },
          },
        );
      }}
      isSaving={isPending}
    />
  );
}
