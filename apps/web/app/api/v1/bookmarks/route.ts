import { NextRequest } from "next/server";
import { z } from "zod";

import { buildHandler } from "../utils/handler";
import { adaptPagination, zPagination } from "../utils/pagination";
import { zStringBool } from "../utils/types";

export const dynamic = "force-dynamic";

export const GET = (req: NextRequest) =>
  buildHandler({
    req,
    searchParamsSchema: z
      .object({
        favourited: zStringBool.optional(),
        archived: zStringBool.optional(),
      })
      .and(zPagination),
    handler: async ({ api, searchParams }) => {
      const bookmarks = await api.bookmarks.getBookmarks({
        ...searchParams,
      });
      return { status: 200, resp: adaptPagination(bookmarks) };
    },
  });
