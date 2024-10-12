"use client";

import React, { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useDoBookmarkSearch } from "@/lib/hooks/bookmark-search";

const SearchInput = React.forwardRef<
  HTMLInputElement,
  React.HTMLAttributes<HTMLInputElement> & { loading?: boolean }
>(({ className, ...props }, ref) => {
  const { debounceSearch, searchQuery, isInSearchPage } = useDoBookmarkSearch();

  const [value, setValue] = React.useState(searchQuery);

  useEffect(() => {
    if (!isInSearchPage) {
      setValue("");
    }
  }, [isInSearchPage]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    debounceSearch(e.target.value);
  };

  return (
    <Input
      ref={ref}
      value={value}
      onChange={onChange}
      placeholder="Search"
      defaultValue={searchQuery}
      className={className}
      {...props}
    />
  );
});
SearchInput.displayName = "SearchInput";

export { SearchInput };
