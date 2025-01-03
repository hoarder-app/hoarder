import { useRouter, useSearchParams } from "next/navigation";
import { ButtonWithTooltip } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/lib/i18n/client";
import { Check, SortDesc } from "lucide-react";

import type { SortOrder } from "@hoarder/shared/types/bookmarks";

export default function SortOrderToggle() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = (searchParams.get("sort") as SortOrder) ?? "desc";

  const updateSort = (newSort: SortOrder) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", newSort);
    router.replace(`?${params.toString()}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ButtonWithTooltip
          tooltip={t("actions.sort.title")}
          delayDuration={100}
          variant="ghost"
        >
          <SortDesc size={18} />
        </ButtonWithTooltip>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-fit">
        <DropdownMenuItem
          className="cursor-pointer justify-between"
          onClick={() => updateSort("desc")}
        >
          <span>{t("actions.sort.newest_first")}</span>
          {currentSort === "desc" && <Check className="ml-2 size-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer justify-between"
          onClick={() => updateSort("asc")}
        >
          <span>{t("actions.sort.oldest_first")}</span>
          {currentSort === "asc" && <Check className="ml-2 size-4" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
