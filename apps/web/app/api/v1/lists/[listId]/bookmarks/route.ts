import { NextRequest } from "next/server";
import { buildHandler } from "@/app/api/v1/utils/handler";
import { adaptPagination, zPagination } from "@/app/api/v1/utils/pagination";
import { zGetBookmarkQueryParamsSchema } from "@/app/api/v1/utils/types";

export const dynamic = "force-dynamic";

export const GET = (req: NextRequest, params: { params: { listId: string } }) =>
  buildHandler({
    req,
    searchParamsSchema: zPagination.and(zGetBookmarkQueryParamsSchema),
    handler: async ({ api, searchParams }) => {
      const bookmarks = await api.bookmarks.getBookmarks({
        listId: params.params.listId,
        ...searchParams,
      });
      return { status: 200, resp: adaptPagination(bookmarks) };
    },
  });
