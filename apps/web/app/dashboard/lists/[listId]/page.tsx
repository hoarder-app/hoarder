import { notFound, redirect } from "next/navigation";
import DeleteListButton from "@/components/dashboard/lists/DeleteListButton";
import ListView from "@/components/dashboard/lists/ListView";
import { api } from "@/server/api/client";
import { getServerAuthSession } from "@/server/auth";
import { TRPCError } from "@trpc/server";

export default async function ListPage({
  params,
}: {
  params: { listId: string };
}) {
  const session = await getServerAuthSession();
  if (!session) {
    redirect("/");
  }

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

  const bookmarks = await api.bookmarks.getBookmarks({ ids: list.bookmarks });

  return (
    <div className="container flex flex-col gap-3">
      <div className="flex justify-between">
        <span className="pt-4 text-2xl">
          {list.icon} {list.name}
        </span>
        <DeleteListButton list={list} />
      </div>
      <hr />
      <ListView list={list} bookmarks={bookmarks.bookmarks} />
    </div>
  );
}
