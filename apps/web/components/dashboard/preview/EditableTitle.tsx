import { useEffect, useRef, useState } from "react";
import { ActionButtonWithTooltip } from "@/components/ui/action-button";
import { ButtonWithTooltip } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/components/ui/use-toast";
import { Check, Pencil, X } from "lucide-react";

import { useUpdateBookmark } from "@hoarder/shared-react/hooks/bookmarks";
import { ZBookmark } from "@hoarder/shared/types/bookmarks";

interface Props {
  bookmarkId: string;
  originalTitle: string | null;
  setEditable: (editable: boolean) => void;
}

function EditMode({ bookmarkId, originalTitle, setEditable }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const { mutate: updateBookmark, isPending } = useUpdateBookmark({
    onSuccess: () => {
      toast({
        description: "Title updated!",
      });
    },
  });

  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
      ref.current.textContent = originalTitle;
    }
  }, [ref]);

  const onSave = () => {
    let toSave: string | null = ref.current?.textContent ?? null;
    if (originalTitle == toSave) {
      // Nothing to do here
      return;
    }
    if (toSave == "") {
      toSave = null;
    }
    updateBookmark({
      bookmarkId,
      title: toSave,
    });
    setEditable(false);
  };

  return (
    <div className="flex gap-3">
      <div
        ref={ref}
        role="presentation"
        className="p-2 text-center text-lg"
        contentEditable={true}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
          }
        }}
      />
      <ActionButtonWithTooltip
        tooltip="Save"
        delayDuration={500}
        size="none"
        variant="ghost"
        className="align-middle text-gray-400"
        loading={isPending}
        onClick={() => onSave()}
      >
        <Check className="size-4" />
      </ActionButtonWithTooltip>
      <ButtonWithTooltip
        tooltip="Cancel"
        delayDuration={500}
        size="none"
        variant="ghost"
        className="align-middle text-gray-400"
        onClick={() => {
          setEditable(false);
        }}
      >
        <X className="size-4" />
      </ButtonWithTooltip>
    </div>
  );
}

function ViewMode({ originalTitle, setEditable }: Props) {
  return (
    <Tooltip delayDuration={500}>
      <div className="flex items-center gap-3 text-center">
        <TooltipTrigger asChild>
          {originalTitle ? (
            <p className="line-clamp-2 text-lg">{originalTitle}</p>
          ) : (
            <p className="text-lg italic text-gray-600">Untitled</p>
          )}
        </TooltipTrigger>
        <ButtonWithTooltip
          delayDuration={500}
          tooltip="Edit title"
          size="none"
          variant="ghost"
          className="align-middle text-gray-400"
          onClick={() => {
            setEditable(true);
          }}
        >
          <Pencil className="size-4" />
        </ButtonWithTooltip>
      </div>
      <TooltipPortal>
        {originalTitle && (
          <TooltipContent side="bottom" className="max-w-[40ch]">
            {originalTitle}
          </TooltipContent>
        )}
      </TooltipPortal>
    </Tooltip>
  );
}

export function EditableTitle({ bookmark }: { bookmark: ZBookmark }) {
  const [editable, setEditable] = useState(false);

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

  return editable ? (
    <EditMode
      bookmarkId={bookmark.id}
      originalTitle={title}
      setEditable={setEditable}
    />
  ) : (
    <ViewMode
      bookmarkId={bookmark.id}
      originalTitle={title}
      setEditable={setEditable}
    />
  );
}
