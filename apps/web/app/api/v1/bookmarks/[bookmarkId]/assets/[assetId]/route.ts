import { NextRequest } from "next/server";
import { buildHandler } from "@/app/api/v1/utils/handler";
import { z } from "zod";

export const dynamic = "force-dynamic";

export const PUT = (
  req: NextRequest,
  params: { params: { bookmarkId: string; assetId: string } },
) =>
  buildHandler({
    req,
    bodySchema: z.object({ assetId: z.string() }),
    handler: async ({ api, body }) => {
      await api.bookmarks.replaceAsset({
        bookmarkId: params.params.bookmarkId,
        oldAssetId: params.params.assetId,
        newAssetId: body!.assetId,
      });
      return { status: 204 };
    },
  });

export const DELETE = (
  req: NextRequest,
  params: { params: { bookmarkId: string; assetId: string } },
) =>
  buildHandler({
    req,
    handler: async ({ api }) => {
      await api.bookmarks.detachAsset({
        bookmarkId: params.params.bookmarkId,
        assetId: params.params.assetId,
      });
      return { status: 204 };
    },
  });
