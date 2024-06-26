import React from "react";
import Bookmarks from "@/components/dashboard/bookmarks/Bookmarks";
import GlobalActions from "@/components/dashboard/GlobalActions";
import { SearchInput } from "@/components/dashboard/search/SearchInput";

export default async function BookmarksPage() {
  return (
    <div>
      <div className="flex gap-2">
        <SearchInput />
        <GlobalActions />
      </div>
      <div className="my-4">
        <Bookmarks query={{ archived: false }} showEditorCard={true} />
      </div>
    </div>
  );
}
