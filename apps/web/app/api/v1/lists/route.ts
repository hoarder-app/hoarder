import { NextRequest } from "next/server";

import { zNewBookmarkListSchema } from "@hoarder/shared/types/lists";

import { buildHandler } from "../utils/handler";

export const dynamic = "force-dynamic";

export const GET = (req: NextRequest) =>
  buildHandler({
    req,
    handler: async ({ api }) => {
      const lists = await api.lists.list();
      return { status: 200, resp: lists };
    },
  });

export const POST = (req: NextRequest) =>
  buildHandler({
    req,
    bodySchema: zNewBookmarkListSchema,
    handler: async ({ api, body }) => {
      const list = await api.lists.create(body!);
      return { status: 201, resp: list };
    },
  });
