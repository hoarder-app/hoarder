import { Separator } from "@/components/ui/separator";
import { api } from "@/server/api/client";

import type { ZGetBookmarksRequest } from "@hoarder/shared/types/bookmarks";

import UpdatableBookmarksGrid from "./UpdatableBookmarksGrid";

export default async function Bookmarks({
  query,
  header,
  showDivider,
  showEditorCard = false,
}: {
  query: Omit<ZGetBookmarksRequest, "sortOrder">; // Sort order is handled by the store
  header?: React.ReactNode;
  showDivider?: boolean;
  showEditorCard?: boolean;
}) {
  const bookmarks = await api.bookmarks.getBookmarks(query);

  return (
    <div className="flex flex-col gap-3">
      {header}
      {showDivider && <Separator />}
      <UpdatableBookmarksGrid
        query={query}
        bookmarks={bookmarks}
        showEditorCard={showEditorCard}
      />
    </div>
  );
}
