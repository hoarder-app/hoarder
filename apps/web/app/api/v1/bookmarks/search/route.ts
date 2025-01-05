import { NextRequest } from "next/server";
import { z } from "zod";

import { buildHandler } from "../../utils/handler";

export const dynamic = "force-dynamic";

export const GET = (req: NextRequest) =>
  buildHandler({
    req,
    searchParamsSchema: z.object({
      q: z.string(),
      limit: z.coerce.number().optional(),
      cursor: z
        .string()
        // Search cursor V1 is just a number
        .pipe(z.coerce.number())
        .transform((val) => {
          return { ver: 1 as const, offset: val };
        })
        .optional(),
    }),
    handler: async ({ api, searchParams }) => {
      const bookmarks = await api.bookmarks.searchBookmarks({
        text: searchParams.q,
        cursor: searchParams.cursor,
        limit: searchParams.limit,
      });
      return {
        status: 200,
        resp: {
          bookmarks: bookmarks.bookmarks,
          nextCursor: bookmarks.nextCursor
            ? `${bookmarks.nextCursor.offset}`
            : null,
        },
      };
    },
  });
