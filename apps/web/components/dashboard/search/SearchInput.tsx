"use client";

import React, { useEffect, useImperativeHandle, useRef } from "react";
import { Input } from "@/components/ui/input";
import { useDoBookmarkSearch } from "@/lib/hooks/bookmark-search";
import { useTranslation } from "@/lib/i18n/client";

function useFocusSearchOnKeyPress(
  inputRef: React.RefObject<HTMLInputElement | null>,
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
  const { debounceSearch, searchQuery, isInSearchPage } = useDoBookmarkSearch();

  const [value, setValue] = React.useState(searchQuery);

  const inputRef = useRef<HTMLInputElement>(null);
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    debounceSearch(e.target.value);
  };

  useFocusSearchOnKeyPress(inputRef, onChange);
  useImperativeHandle(ref, () => inputRef.current!);

  useEffect(() => {
    if (!isInSearchPage) {
      setValue("");
    }
  }, [isInSearchPage]);

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={onChange}
      placeholder={t("common.search")}
      className={className}
      {...props}
    />
  );
});
SearchInput.displayName = "SearchInput";

export { SearchInput };
