import { NextRequest } from "next/server";
import { buildHandler } from "@/app/api/v1/utils/handler";
import { adaptPagination, zPagination } from "@/app/api/v1/utils/pagination";

export const dynamic = "force-dynamic";

export const GET = (req: NextRequest, params: { params: { listId: string } }) =>
  buildHandler({
    req,
    searchParamsSchema: zPagination,
    handler: async ({ api, searchParams }) => {
      const bookmarks = await api.bookmarks.getBookmarks({
        listId: params.params.listId,
        ...searchParams,
      });
      return { status: 200, resp: adaptPagination(bookmarks) };
    },
  });
