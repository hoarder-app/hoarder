import React from "react";
import Bookmarks from "@/components/dashboard/bookmarks/Bookmarks";
import TopNav from "@/components/dashboard/bookmarks/TopNav";
import { Separator } from "@/components/ui/separator";

export default async function BookmarksPage() {
  return (
    <div>
      <TopNav />
      <Separator />
      <div className="my-4 flex-1">
        <Bookmarks
          header={<p className="text-2xl">Bookmarks</p>}
          query={{ archived: false }}
          showEditorCard={true}
        />
      </div>
    </div>
  );
}
