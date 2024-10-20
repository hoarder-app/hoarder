import { NextRequest } from "next/server";
import { buildHandler } from "@/app/api/v1/utils/handler";
import { adaptPagination, zPagination } from "@/app/api/v1/utils/pagination";

export const dynamic = "force-dynamic";

export const GET = (
  req: NextRequest,
  { params }: { params: { listId: string } },
) =>
  buildHandler({
    req,
    searchParamsSchema: zPagination,
    handler: async ({ api, searchParams }) => {
      const [list, bookmarks] = await Promise.all([
        api.lists.get({
          listId: params.listId,
        }),
        api.bookmarks.getBookmarks({
          listId: params.listId,
          limit: searchParams.limit,
          cursor: searchParams.cursor,
        }),
      ]);
      return {
        status: 200,
        resp: {
          ...list,
          ...adaptPagination(bookmarks),
        },
      };
    },
  });
