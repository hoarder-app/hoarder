import { NextRequest } from "next/server";
import { buildHandler } from "@/app/api/v1/utils/handler";

import { zEditBookmarkListSchema } from "@hoarder/shared/types/lists";

export const dynamic = "force-dynamic";

export const GET = (
  req: NextRequest,
  { params }: { params: { listId: string } },
) =>
  buildHandler({
    req,
    handler: async ({ api }) => {
      const list = await api.lists.get({
        listId: params.listId,
      });
      return {
        status: 200,
        resp: list,
      };
    },
  });

export const PATCH = (
  req: NextRequest,
  { params }: { params: { listId: string } },
) =>
  buildHandler({
    req,
    bodySchema: zEditBookmarkListSchema.omit({ listId: true }),
    handler: async ({ api, body }) => {
      const list = await api.lists.edit({
        ...body!,
        listId: params.listId,
      });
      return { status: 200, resp: list };
    },
  });

export const DELETE = (
  req: NextRequest,
  { params }: { params: { listId: string } },
) =>
  buildHandler({
    req,
    handler: async ({ api }) => {
      await api.lists.delete({
        listId: params.listId,
      });
      return {
        status: 204,
      };
    },
  });
