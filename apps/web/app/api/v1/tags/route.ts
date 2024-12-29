import { NextRequest } from "next/server";

import { buildHandler } from "../utils/handler";

export const dynamic = "force-dynamic";

export const GET = (req: NextRequest) =>
  buildHandler({
    req,
    handler: async ({ api }) => {
      const tags = await api.tags.list();
      return { status: 200, resp: tags };
    },
  });
