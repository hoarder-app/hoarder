import type { Metadata } from "next";
import PublicLists from "@/components/public/lists/PublicLists";
import { api } from "@/server/api/client";

export async function generateMetadata({
  params,
}: {
  params: { listId: string };
}): Promise<Metadata> {
  // TODO: Don't load the entire list, just create an endpoint to get the list name
  const resp = await api.publicBookmarks.getPublicBookmarksInList({
    listId: params.listId,
  });

  return {
    title: `${resp.list.name} - Karakeep`,
  };
}

export default async function PublicListPage({
  params,
}: {
  params: { listId: string };
}) {
  const resp = await api.publicBookmarks.getPublicBookmarksInList({
    listId: params.listId,
  });

  return (
    <PublicLists
      bookmarks={resp.bookmarks}
      list={{
        id: params.listId,
        name: resp.list.name,
        description: resp.list.description,
        icon: resp.list.icon,
        numItems: resp.list.numItems,
      }}
      nextCursor={resp.nextCursor}
    />
  );
}
