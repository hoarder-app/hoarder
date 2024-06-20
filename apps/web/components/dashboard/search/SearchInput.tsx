"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { useDoBookmarkSearch } from "@/lib/hooks/bookmark-search";

const SearchInput = React.forwardRef<
  HTMLInputElement,
  React.HTMLAttributes<HTMLInputElement> & { loading?: boolean }
>(({ className, ...props }, ref) => {
  const { debounceSearch, searchQuery } = useDoBookmarkSearch();
  const isSearchEnabled = process.env.MEILISEARCH_ENABLED;

  return (
    <Input
      ref={ref}
      placeholder={
        isSearchEnabled ? "Search your bookmarks" : "Search is disabled"
      }
      disabled={!isSearchEnabled}
      defaultValue={searchQuery}
      onChange={(e) => debounceSearch(e.target.value)}
      className={className}
      {...props}
    />
  );
});
SearchInput.displayName = "SearchInput";

export { SearchInput };
