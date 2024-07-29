import React from "react";
import Bookmarks from "@/components/dashboard/bookmarks/Bookmarks";
import GlobalActions from "@/components/dashboard/GlobalActions";
import { SearchInput } from "@/components/dashboard/search/SearchInput";

export default async function BookmarksPage() {
  return (
    <div className="p-4">
      <div className="mb-4 flex gap-2">
        <SearchInput className="flex-1" />
        <GlobalActions />
      </div>
      <div className="mt-1 w-full">
        {" "}
        {/* Change from w-max to w-full */}
        <Bookmarks query={{ archived: false }} showEditorCard={true} />
      </div>
    </div>
  );
}
