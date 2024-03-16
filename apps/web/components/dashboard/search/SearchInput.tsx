"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { useDoBookmarkSearch } from "@/lib/hooks/bookmark-search";
import { cn } from "@/lib/utils";

const SearchInput = React.forwardRef<
  HTMLInputElement,
  React.HTMLAttributes<HTMLInputElement> & { loading?: boolean }
>(({ className, loading = false, ...props }, ref) => {
  const { debounceSearch, searchQuery } = useDoBookmarkSearch();

  return (
    <Input
      ref={ref}
      placeholder="Search"
      defaultValue={searchQuery}
      onChange={(e) => debounceSearch(e.target.value)}
      className={cn(loading ? "animate-pulse-border" : undefined, className)}
      {...props}
    />
  );
});
SearchInput.displayName = "SearchInput";

export { SearchInput };
