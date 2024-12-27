import { ActionButton } from "@/components/ui/action-button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "@/components/ui/use-toast";
import { useTranslation } from "@/lib/i18n/client";
import { api } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Separator } from "@radix-ui/react-dropdown-menu";
import { ChevronsDownUp, Trash2 } from "lucide-react";

import { useDeleteHighlight } from "@hoarder/shared-react/hooks/highlights";
import { ZHighlight } from "@hoarder/shared/types/highlights";

import { HIGHLIGHT_COLOR_MAP } from "./highlights";

function HighlightCard({ highlight }: { highlight: ZHighlight }) {
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
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button onClick={onBookmarkClick}>
          <blockquote
            className={cn(
              "prose border-l-[6px] p-2 pl-6 italic dark:prose-invert prose-p:text-sm",
              HIGHLIGHT_COLOR_MAP["border-l"][highlight.color],
            )}
          >
            <p>{highlight.text}</p>
          </blockquote>
        </button>
      </div>
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

export default function HighlightsBox({ bookmarkId }: { bookmarkId: string }) {
  const { t } = useTranslation();

  const { data: highlights, isPending: isLoading } =
    api.highlights.getForBookmark.useQuery({ bookmarkId });

  if (isLoading || !highlights || highlights?.highlights.length === 0) {
    return null;
  }

  return (
    <Collapsible defaultOpen={true}>
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 text-sm text-gray-400">
        {t("common.highlights")}
        <ChevronsDownUp className="size-4" />
      </CollapsibleTrigger>
      <CollapsibleContent className="group flex flex-col py-3 text-sm">
        {highlights.highlights.map((highlight) => (
          <>
            <HighlightCard key={highlight.id} highlight={highlight} />
            <Separator className="m-2 h-0.5 bg-gray-200 last:hidden" />
          </>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
