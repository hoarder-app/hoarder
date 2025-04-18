import PublicLists from "@/components/public/lists/PublicLists";
import { api } from "@/server/api/client";

export default async function PublicListPage({
  params,
}: {
  params: { listId: string };
}) {
  const resp = await api.publicBookmarks.getPublicBookmarksInList({
    listId: params.listId,
  });

  return (
    <>
      <PublicLists
        bookmarks={resp.bookmarks}
        list={{
          id: params.listId,
          name: resp.list.name,
          description: resp.list.description,
          icon: resp.list.icon,
        }}
        nextCursor={resp.nextCursor}
      />
    </>
  );
}
