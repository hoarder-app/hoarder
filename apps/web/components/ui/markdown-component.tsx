import React, { useState } from "react";
import { ActionButton } from "@/components/ui/action-button";
import MarkdownEditor from "@/components/ui/markdown/markdown-editor";
import { toast } from "@/components/ui/use-toast";
import { useTranslation } from "@/lib/i18n/client";

import type { ZBookmarkTypeText } from "@hoarder/shared/types/bookmarks";
import { useUpdateBookmarkText } from "@hoarder/shared-react/hooks/bookmarks";

export function MarkdownComponent({
  children: bookmark,
  readOnly = true,
}: {
  children: ZBookmarkTypeText;
  readOnly?: boolean;
}) {
  const { t } = useTranslation();

  const [noteText, setNoteText] = useState(bookmark.content.text);

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

  const onSave = () => {
    updateBookmarkMutator({
      bookmarkId: bookmark.id,
      text: noteText,
    });
  };
  return (
    <>
      <MarkdownEditor
        readonly={readOnly}
        onChangeMarkdown={(value: string) => {
          setNoteText(value);
        }}
      >
        {bookmark.content.text}
      </MarkdownEditor>
      {!readOnly && (
        <div className="absolute bottom-2 right-2">
          <ActionButton
            type="button"
            loading={isPending}
            onClick={onSave}
            disabled={isPending}
          >
            {t("actions.save")}
          </ActionButton>
        </div>
      )}
    </>
  );
}
