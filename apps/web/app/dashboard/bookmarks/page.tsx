import React from "react";
import Bookmarks from "@/components/dashboard/bookmarks/Bookmarks";
import GlobalActions from "@/components/dashboard/GlobalActions";
import { SearchInput } from "@/components/dashboard/search/SearchInput";

export default async function BookmarksPage() {
  return (
    <div className="flex flex-col gap-3">
      <div className="sticky top-0 z-[51] flex gap-2 bg-muted py-4">
        <SearchInput />
        <GlobalActions />
      </div>
      <div className="my-2">
        <Bookmarks query={{ archived: false }} showEditorCard={true} />
      </div>
    </div>
  );
}
