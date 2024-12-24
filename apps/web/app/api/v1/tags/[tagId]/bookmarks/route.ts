import { NextRequest } from "next/server";
import { buildHandler } from "@/app/api/v1/utils/handler";
import { adaptPagination, zPagination } from "@/app/api/v1/utils/pagination";

export const dynamic = "force-dynamic";

export const GET = async (req: NextRequest, props: { params: Promise<{ tagId: string }> }) => {
  const params = await props.params;

  return buildHandler({
    req,
    searchParamsSchema: zPagination,
    handler: async ({ api, searchParams }) => {
      const bookmarks = await api.bookmarks.getBookmarks({
        tagId: params.tagId,
        limit: searchParams.limit,
        cursor: searchParams.cursor,
      });
      return {
        status: 200,
        resp: adaptPagination(bookmarks),
      };
    },
  });
};
