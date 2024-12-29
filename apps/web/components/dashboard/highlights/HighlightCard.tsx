import { ActionButton } from "@/components/ui/action-button";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";

import { useDeleteHighlight } from "@hoarder/shared-react/hooks/highlights";
import { ZHighlight } from "@hoarder/shared/types/highlights";

import { HIGHLIGHT_COLOR_MAP } from "../preview/highlights";

export default function HighlightCard({
  highlight,
  clickable,
  className,
}: {
  highlight: ZHighlight;
  clickable: boolean;
  className?: string;
}) {
  const { mutate: deleteHighlight, isPending: isDeleting } = useDeleteHighlight(
    {
      onSuccess: () => {
        toast({
          description: "Highlight has been deleted!",
        });
      },
      onError: () => {
        toast({
          description: "Something went wrong",
          variant: "destructive",
        });
      },
    },
  );

  const onBookmarkClick = () => {
    document
      .querySelector(`[data-highlight-id="${highlight.id}"]`)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
  };

  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    clickable ? (
      <button onClick={onBookmarkClick}>{children}</button>
    ) : (
      <div>{children}</div>
    );

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <Wrapper>
        <blockquote
          cite={highlight.bookmarkId}
          className={cn(
            "prose border-l-[6px] p-2 pl-6 italic dark:prose-invert prose-p:text-sm",
            HIGHLIGHT_COLOR_MAP["border-l"][highlight.color],
          )}
        >
          <p>{highlight.text}</p>
        </blockquote>
      </Wrapper>
      <div className="flex gap-2">
        <ActionButton
          loading={isDeleting}
          variant="ghost"
          onClick={() => deleteHighlight({ highlightId: highlight.id })}
        >
          <Trash2 className="size-4 text-destructive" />
        </ActionButton>
      </div>
    </div>
  );
}
