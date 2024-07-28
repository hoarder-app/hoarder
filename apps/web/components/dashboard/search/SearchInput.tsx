"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { useDoBookmarkSearch } from "@/lib/hooks/bookmark-search";
import { Search } from "lucide-react"; // Import the Search icon from lucide-react
import { useTheme } from "next-themes";

const SearchInput = React.forwardRef<
  HTMLInputElement,
  React.HTMLAttributes<HTMLInputElement> & { loading?: boolean }
>(({ className, ...props }, ref) => {
  const { debounceSearch, searchQuery } = useDoBookmarkSearch();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative mx-auto flex w-full max-w-lg items-center">
      <Search className="absolute left-3 text-gray-400" size={20} />
      <Input
        ref={ref}
        placeholder="Search ..."
        defaultValue={searchQuery}
        onChange={(e) => debounceSearch(e.target.value)}
        className={`w-full rounded-full border py-2 pl-10 pr-4 focus:outline-none focus:ring-2 ${
          mounted && theme === "dark"
            ? "border-gray-700 bg-gray-800 text-white focus:border-gray-500 focus:ring-gray-500"
            : "border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500"
        } ${className}`}
        {...props}
      />
    </div>
  );
});
SearchInput.displayName = "SearchInput";

export { SearchInput };
