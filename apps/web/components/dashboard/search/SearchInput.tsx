"use client";

import React, { useEffect, useImperativeHandle, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useDoBookmarkSearch } from "@/lib/hooks/bookmark-search";
import { useSearchHistory } from "@/lib/hooks/useSearchHistory";
import { useTranslation } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { SearchIcon } from "lucide-react";

import { EditListModal } from "../lists/EditListModal";
import QueryExplainerTooltip from "./QueryExplainerTooltip";
import { SearchAutocomplete } from "./SearchAutocomplete";

function useFocusSearchOnKeyPress(
  inputRef: React.RefObject<HTMLInputElement>,
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
  setPopoverOpen: React.Dispatch<React.SetStateAction<boolean>>,
) {
  useEffect(() => {
    function handleKeyPress(e: KeyboardEvent) {
      if (!inputRef.current) {
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.code === "KeyK") {
        e.preventDefault();
        inputRef.current.focus();
        // Move the cursor to the end of the input field, so you can continue typing
        const length = inputRef.current.value.length;
        inputRef.current.setSelectionRange(length, length);
        setPopoverOpen(true);
      }
      if (
        e.code === "Escape" &&
        e.target == inputRef.current &&
        inputRef.current.value !== ""
      ) {
        e.preventDefault();
        inputRef.current.blur();
        inputRef.current.value = "";
        onChange({
          target: inputRef.current,
        } as React.ChangeEvent<HTMLInputElement>);
      }
    }

    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [inputRef, onChange]);
}

const SearchInput = React.forwardRef<
  HTMLInputElement,
  React.HTMLAttributes<HTMLInputElement> & { loading?: boolean }
>(({ className, ...props }, ref) => {
  const { t } = useTranslation();
  const {
    debounceSearch,
    searchQuery,
    doSearch,
    parsedSearchQuery,
    isInSearchPage,
  } = useDoBookmarkSearch();
  const { addTerm } = useSearchHistory();

  const [value, setValue] = React.useState(searchQuery);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    debounceSearch(e.target.value);
  };

  const handleHistorySelect = (term: string) => {
    setValue(term);
    doSearch(term);
    addTerm(term);
    setPopoverOpen(false);
    inputRef.current?.blur();
  };

  useFocusSearchOnKeyPress(inputRef, onChange, setPopoverOpen);
  useImperativeHandle(ref, () => inputRef.current!);
  const [newNestedListModalOpen, setNewNestedListModalOpen] = useState(false);

  useEffect(() => {
    if (!isInSearchPage) {
      setValue("");
    }
  }, [isInSearchPage]);

  const handleBlur = () => {
    if (popoverRef.current) {
      // blur caused by select history
      return;
    }
    if (value) {
      addTerm(value);
    }
    setPopoverOpen(false);
  };

  const handleFocus = () => {
    popoverRef.current = false;
    setPopoverOpen(true);
  };

  return (
    <div className={cn("relative flex-1", className)}>
      <Popover open={popoverOpen}>
        <EditListModal
          open={newNestedListModalOpen}
          setOpen={setNewNestedListModalOpen}
          prefill={{
            type: "smart",
            query: value,
          }}
        />
        <QueryExplainerTooltip
          className="-translate-1/2 absolute right-1.5 top-2 stroke-foreground p-0.5"
          parsedSearchQuery={parsedSearchQuery}
        />
        {parsedSearchQuery.result === "full" &&
          parsedSearchQuery.text.length == 0 && (
            <Button
              onClick={() => setNewNestedListModalOpen(true)}
              size="none"
              variant="secondary"
              className="absolute right-9 top-2 z-50 px-2 py-1 text-xs"
            >
              {t("actions.save")}
            </Button>
          )}
        <PopoverTrigger asChild>
          <Input
            startIcon={
              <SearchIcon size={18} className="text-muted-foreground" />
            }
            ref={inputRef}
            type="text"
            value={value}
            onChange={onChange}
            placeholder={t("common.search")}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onMouseDown={() => {
            popoverRef.current = true;
          }}
        >
          <SearchAutocomplete
            searchQuery={value}
            onSelect={handleHistorySelect}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
});
SearchInput.displayName = "SearchInput";

export { SearchInput };
