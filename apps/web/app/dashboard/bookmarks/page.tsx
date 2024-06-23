import React from "react";
import Bookmarks from "@/components/dashboard/bookmarks/Bookmarks";
import ChangeLayout from "@/components/dashboard/ChangeLayout";
import { SearchInput } from "@/components/dashboard/search/SearchInput";

export default async function BookmarksPage() {
  return (
    <div>
      <div className="flex gap-2">
        <SearchInput />
        <ChangeLayout />
      </div>
      <div className="my-4 flex-1">
        <Bookmarks query={{ archived: false }} showEditorCard={true} />
      </div>
    </div>
  );
}
