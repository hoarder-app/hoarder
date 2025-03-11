import { NextRequest } from "next/server";

import { buildHandler } from "../../../utils/handler";

export const dynamic = "force-dynamic";

export const GET = (req: NextRequest) =>
  buildHandler({
    req,
    handler: async ({ api }) => {
      const stats = await api.users.stats();
      return { status: 200, resp: stats };
    },
  });
