import { NextRequest } from "next/server";

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
