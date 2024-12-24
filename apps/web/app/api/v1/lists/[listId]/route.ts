import { NextRequest } from "next/server";
import { buildHandler } from "@/app/api/v1/utils/handler";

import { zNewBookmarkListSchema } from "@hoarder/shared/types/lists";

export const dynamic = "force-dynamic";

export const GET = async (req: NextRequest, props: { params: Promise<{ listId: string }> }) => {
  const params = await props.params;

  return buildHandler({
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
};

export const PATCH = async (req: NextRequest, props: { params: Promise<{ listId: string }> }) => {
  const params = await props.params;

  return buildHandler({
    req,
    bodySchema: zNewBookmarkListSchema.partial(),
    handler: async ({ api, body }) => {
      const list = await api.lists.edit({
        listId: params.listId,
        ...body!,
      });
      return { status: 200, resp: list };
    },
  });
};

export const DELETE = async (req: NextRequest, props: { params: Promise<{ listId: string }> }) => {
  const params = await props.params;

  return buildHandler({
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
};
