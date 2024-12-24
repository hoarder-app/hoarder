import { notFound } from "next/navigation";
import Bookmarks from "@/components/dashboard/bookmarks/Bookmarks";
import ListHeader from "@/components/dashboard/lists/ListHeader";
import { api } from "@/server/api/client";
import { TRPCError } from "@trpc/server";

export default async function ListPage(
  props: {
    params: Promise<{ listId: string }>;
  }
) {
  const params = await props.params;
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
    <Bookmarks
      query={{ listId: list.id }}
      showDivider={true}
      showEditorCard={true}
      header={<ListHeader initialData={list} />}
    />
  );
}
