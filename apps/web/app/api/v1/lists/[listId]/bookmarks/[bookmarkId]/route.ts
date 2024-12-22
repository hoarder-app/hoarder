import { NextRequest } from "next/server";
import { buildHandler } from "@/app/api/v1/utils/handler";

export const dynamic = "force-dynamic";

export const PUT = async (
  req: NextRequest,
  props: { params: Promise<{ listId: string; bookmarkId: string }> }
) => {
  const params = await props.params;

  return buildHandler({
    req,
    handler: async ({ api }) => {
      // TODO: PUT is supposed to be idempotent, but we currently fail if the bookmark is already in the list.
      await api.lists.addToList({
        listId: params.listId,
        bookmarkId: params.bookmarkId,
      });
      return { status: 204 };
    },
  });
};

export const DELETE = async (
  req: NextRequest,
  props: { params: Promise<{ listId: string; bookmarkId: string }> }
) => {
  const params = await props.params;

  return buildHandler({
    req,
    handler: async ({ api }) => {
      await api.lists.removeFromList({
        listId: params.listId,
        bookmarkId: params.bookmarkId,
      });
      return { status: 204 };
    },
  });
};
