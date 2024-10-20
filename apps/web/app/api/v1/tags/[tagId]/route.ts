import { NextRequest } from "next/server";
import { buildHandler } from "@/app/api/v1/utils/handler";

export const dynamic = "force-dynamic";

export const GET = (
  req: NextRequest,
  { params }: { params: { tagId: string } },
) =>
  buildHandler({
    req,
    handler: async ({ api }) => {
      const tag = await api.tags.get({
        tagId: params.tagId,
      });
      return {
        status: 200,
        resp: tag,
      };
    },
  });

export const DELETE = (
  req: NextRequest,
  { params }: { params: { tagId: string } },
) =>
  buildHandler({
    req,
    handler: async ({ api }) => {
      await api.tags.delete({
        tagId: params.tagId,
      });
      return {
        status: 204,
      };
    },
  });
