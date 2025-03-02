import { NextRequest } from "next/server";
import { z } from "zod";

import { buildHandler } from "../../utils/handler";

export const dynamic = "force-dynamic";

export const POST = (req: NextRequest) =>
  buildHandler({
    req,
    searchParamsSchema: z.object({ bookmarkId: z.string() }),
    handler: async ({ api, searchParams }) => {
      const bookmark = await api.bookmarks.summarizeBookmark({
        bookmarkId: searchParams.bookmarkId,
      });

      return { status: 200, resp: bookmark }
    },
  });
