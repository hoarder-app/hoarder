"use client";

import { Suspense, useRef } from "react";
import { SearchInput } from "@/components/dashboard/search/SearchInput";
import { FullPageSpinner } from "@/components/ui/full-page-spinner";
import { Separator } from "@/components/ui/separator";
import { useBookmarkSearch } from "@/lib/hooks/bookmark-search";
import { api } from "@/lib/trpc";
import UpdatableBookmarksGrid from "@/components/dashboard/bookmarks/UpdatableBookmarksGrid";

function SearchComp() {
    const { data, searchQuery, advanced } = useBookmarkSearch();
    const apiUtils = api.useUtils();

    const inputRef: React.MutableRefObject<HTMLInputElement | null> =
        useRef<HTMLInputElement | null>(null);

    // TODO: This doesn't seem right. The query gets executed too often.
    //  BookmarkSearch should already do the first search and that should be it, until you click on "Load more"
    //  Might also make sense to only load data for advanced queries on "enter", because the query is mostly invalid when you are typing
    apiUtils.bookmarks.getBookmarks.invalidate();

    const query = {advanced, text: searchQuery};

    return (
        <div className="flex flex-col gap-3">
            <SearchInput ref={inputRef} autoFocus={true}/>
            {data?.errorMessage &&
                <div className="flex h-10 w-full rounded-md bg-red-600 px-3 py-2" >
                    ${data.errorMessage}
                </div>
            }
            <Separator/>
            {data ? (
                <UpdatableBookmarksGrid query={query} bookmarks={data}></UpdatableBookmarksGrid>
            ) : (
                <FullPageSpinner/>
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense>
            <SearchComp/>
        </Suspense>
    );
}
