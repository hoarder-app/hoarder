"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { useDoBookmarkSearch } from "@/lib/hooks/bookmark-search";
import InfoTooltip from "@/components/ui/info-tooltip";
import { useSearchParams } from "next/navigation";
import { Switch } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

function getAdvancedValue() {
    return useSearchParams().get("advanced") === "true";
}

const SearchInput = React.forwardRef<
    HTMLInputElement,
    React.HTMLAttributes<HTMLInputElement> & { loading?: boolean }
>(({ className, ...props }, ref) => {
    const { debounceSearch, searchQuery } = useDoBookmarkSearch();

    const [useAdvancedSearch, updateAdvancedSearch] = useState(getAdvancedValue());

    return (
        <div className="flex flex-col w-100">
            <div className="flex flex-row grow">
                <Input
                    ref={ref}
                    placeholder="Search"
                    defaultValue={searchQuery}
                    onChange={(e) => debounceSearch(e.target.value, useAdvancedSearch)}
                    className={className}
                    {...props}
                />
                <div className="flex">
                    <Switch
                        className="gap-x-2 ml-2 my-auto data-[state=unchecked]:bg-gray-700"
                        id="advanced-query"
                        checked={useAdvancedSearch}
                        onCheckedChange={(e) => {
                            updateAdvancedSearch(e);
                            debounceSearch(searchQuery, e);
                        }
                        }
                    >
                    </Switch>
                    <Label htmlFor="advanced-query" className="text-nowrap ml-2 my-auto">Advanced Search</Label>
                    <InfoTooltip size={15} className="my-auto ml-2" variant="explain">
                        <p>Advanced Search allows you to use a query language. Check the documentation for more information TODO: link</p>
                    </InfoTooltip>
                </div>
            </div>
            {!useAdvancedSearch &&
                <div className="flex flex-row grow">

                </div>
            }
        </div>
    );
});
SearchInput.displayName = "SearchInput";

export { SearchInput };
