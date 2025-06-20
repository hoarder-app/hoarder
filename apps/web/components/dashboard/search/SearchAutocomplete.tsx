import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useSearchHistory } from "@/lib/hooks/useSearchHistory";
import { cn } from "@/lib/utils";
import { History } from "lucide-react";

interface SearchHistoryAutocompleteProps {
  searchQuery: string;
  onSelect: (searchTerm: string) => void;
  className?: string;
}

export function SearchAutocomplete({
  searchQuery,
  onSelect,
  className,
}: SearchHistoryAutocompleteProps) {
  const { history } = useSearchHistory();

  const filteredHistory = searchQuery
    ? history.filter((term) =>
        term.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : history;

  return (
    <Command shouldFilter={false} className={cn(className)}>
      <CommandList>
        <CommandEmpty>No matching recent searches.</CommandEmpty>
        <CommandGroup heading="Recent Searches">
          {filteredHistory.map((term) => (
            <CommandItem
              key={term}
              value={term}
              onSelect={() => onSelect(term)}
              className="cursor-pointer"
            >
              <History className="mr-2 h-4 w-4" />
              <span>{term}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
