"use client";

import React, { useEffect, useImperativeHandle, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDoBookmarkSearch } from "@/lib/hooks/bookmark-search";
import { useTranslation } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { SearchIcon } from "lucide-react";

import { EditListModal } from "../lists/EditListModal";
import QueryExplainerTooltip from "./QueryExplainerTooltip";

function useFocusSearchOnKeyPress(
  inputRef: React.RefObject<HTMLInputElement>,
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
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
  const { debounceSearch, searchQuery, parsedSearchQuery, isInSearchPage } =
    useDoBookmarkSearch();

  const [value, setValue] = React.useState(searchQuery);

  const inputRef = useRef<HTMLInputElement>(null);
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    debounceSearch(e.target.value);
  };

  useFocusSearchOnKeyPress(inputRef, onChange);
  useImperativeHandle(ref, () => inputRef.current!);
  const [newNestedListModalOpen, setNewNestedListModalOpen] = useState(false);

  useEffect(() => {
    if (!isInSearchPage) {
      setValue("");
    }
  }, [isInSearchPage]);

  return (
    <div className={cn("relative flex-1", className)}>
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
      <Input
        startIcon={SearchIcon}
        ref={inputRef}
        value={value}
        onChange={onChange}
        placeholder={t("common.search")}
        {...props}
      />
    </div>
  );
});
SearchInput.displayName = "SearchInput";

export { SearchInput };
