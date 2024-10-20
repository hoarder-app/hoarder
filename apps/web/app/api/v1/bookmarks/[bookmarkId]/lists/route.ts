import { NextRequest } from "next/server";
import { buildHandler } from "@/app/api/v1/utils/handler";

export const dynamic = "force-dynamic";

export const GET = (
  req: NextRequest,
  params: { params: { bookmarkId: string } },
) =>
  buildHandler({
    req,
    handler: async ({ api }) => {
      const resp = await api.lists.getListsOfBookmark({
        bookmarkId: params.params.bookmarkId,
      });
      return { status: 200, resp };
    },
  });
