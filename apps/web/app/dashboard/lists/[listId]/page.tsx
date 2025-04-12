import { notFound } from "next/navigation";
import Bookmarks from "@/components/dashboard/bookmarks/Bookmarks";
import ListHeader from "@/components/dashboard/lists/ListHeader";
import { api } from "@/server/api/client";
import { TRPCError } from "@trpc/server";

import { BookmarkListContextProvider } from "@karakeep/shared-react/hooks/bookmark-list-context";

export default async function ListPage({
  params,
}: {
  params: { listId: string };
}) {
  let list;
  try {
    list = await api.lists.get({ listId: params.listId });
  } catch (e) {
    if (e instanceof TRPCError) {
      if (e.code == "NOT_FOUND") {
        notFound();
      }
    }
    throw e;
  }

  return (
    <BookmarkListContextProvider list={list}>
      <Bookmarks
        query={{ listId: list.id }}
        showDivider={true}
        showEditorCard={list.type === "manual"}
        header={<ListHeader initialData={list} />}
      />
    </BookmarkListContextProvider>
  );
}
