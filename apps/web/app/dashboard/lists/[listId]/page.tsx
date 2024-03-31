import { notFound } from "next/navigation";
import Bookmarks from "@/components/dashboard/bookmarks/Bookmarks";
import DeleteListButton from "@/components/dashboard/lists/DeleteListButton";
import { BookmarkListContextProvider } from "@/lib/hooks/list-context";
import { api } from "@/server/api/client";
import { TRPCError } from "@trpc/server";

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
    <BookmarkListContextProvider listId={list.id}>
      <Bookmarks
        query={{ listId: list.id, archived: false }}
        showDivider={true}
        header={
          <div className="flex justify-between">
            <span className="text-2xl">
              {list.icon} {list.name}
            </span>
            <DeleteListButton list={list} />
          </div>
        }
      />
    </BookmarkListContextProvider>
  );
}
