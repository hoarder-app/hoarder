import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useTranslation } from "@/lib/i18n/client";
import { api } from "@/lib/trpc";
import { Separator } from "@radix-ui/react-dropdown-menu";
import { ChevronsDownUp } from "lucide-react";

import HighlightCard from "../highlights/HighlightCard";

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
            <HighlightCard key={highlight.id} highlight={highlight} clickable />
            <Separator className="m-2 h-0.5 bg-gray-200 last:hidden" />
          </>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
