import { ButtonWithTooltip } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/lib/i18n/client";
import { useSortOrderStore } from "@/lib/store/useSortOrderStore";
import { Check, SortAsc, SortDesc, ListFilter } from "lucide-react";

export default function SortOrderToggle() {
  const { t } = useTranslation();

  const { sortOrder: currentSort, setSortOrder } = useSortOrderStore();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ButtonWithTooltip
          tooltip={t("actions.sort.title")}
          delayDuration={100}
          variant="ghost"
        >
          {currentSort === "relevance" && (
            <ListFilter size={18} />
          )}
          {currentSort === "asc" && (
            <SortAsc size={18} />
          )}
          {currentSort === "desc" && (
            <SortDesc size={18} />
          )}
        </ButtonWithTooltip>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-fit">
      <DropdownMenuItem
          className="justify-between cursor-pointer"
          onClick={() => setSortOrder("relevance")}
        >
          <div className="flex items-center">
            <ListFilter size={16} className="mr-2" />
            <span>{t("actions.sort.relevant_first")}</span>
          </div>
          {currentSort === "relevance" && <Check className="w-4 h-4 ml-2" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="justify-between cursor-pointer"
          onClick={() => setSortOrder("desc")}
        >
          <div className="flex items-center">
            <SortDesc size={16} className="mr-2" />
            <span>{t("actions.sort.newest_first")}</span>
          </div>
          {currentSort === "desc" && <Check className="w-4 h-4 ml-2" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="justify-between cursor-pointer"
          onClick={() => setSortOrder("asc")}
        >
          <div className="flex items-center">
            <SortAsc size={16} className="mr-2" />
            <span>{t("actions.sort.oldest_first")}</span>
          </div>
          {currentSort === "asc" && <Check className="w-4 h-4 ml-2" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
