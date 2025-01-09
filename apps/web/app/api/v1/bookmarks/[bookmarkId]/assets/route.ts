import { NextRequest } from "next/server";
import { buildHandler } from "@/app/api/v1/utils/handler";

import { zAssetSchema } from "@hoarder/shared/types/bookmarks";

export const dynamic = "force-dynamic";

export const GET = (
  req: NextRequest,
  params: { params: { bookmarkId: string } },
) =>
  buildHandler({
    req,
    handler: async ({ api }) => {
      const resp = await api.bookmarks.getBookmark({
        bookmarkId: params.params.bookmarkId,
      });
      return { status: 200, resp: { assets: resp.assets } };
    },
  });

export const POST = (
  req: NextRequest,
  params: { params: { bookmarkId: string } },
) =>
  buildHandler({
    req,
    bodySchema: zAssetSchema,
    handler: async ({ api, body }) => {
      const asset = await api.bookmarks.attachAsset({
        bookmarkId: params.params.bookmarkId,
        asset: body!,
      });
      return { status: 201, resp: asset };
    },
  });
