import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { api } from "@/server/api/client";
import { getServerAuthSession } from "@/server/auth";

import type { ZGetBookmarksRequest } from "@hoarder/shared/types/bookmarks";

import UpdatableBookmarksGrid from "./UpdatableBookmarksGrid";

export default async function Bookmarks({
  query,
  header,
  showDivider,
  showEditorCard = false,
}: {
  query: ZGetBookmarksRequest;
  header?: React.ReactNode;
  showDivider?: boolean;
  showEditorCard?: boolean;
}) {
  const session = await getServerAuthSession();
  if (!session) {
    redirect("/");
  }

  const bookmarks = await api.bookmarks.getBookmarks(query);

  return (
    <div
      className="flex flex-col gap-3 rounded-full p-2"
      style={{
        backgroundColor: "var(--background-color)",
        color: "var(--text-color)",
      }}
    >
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
