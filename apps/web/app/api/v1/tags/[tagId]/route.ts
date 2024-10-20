import { NextRequest } from "next/server";
import { buildHandler } from "@/app/api/v1/utils/handler";

import { zUpdateTagRequestSchema } from "@hoarder/shared/types/tags";

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

export const PATCH = (
  req: NextRequest,
  { params }: { params: { tagId: string } },
) =>
  buildHandler({
    req,
    bodySchema: zUpdateTagRequestSchema.omit({ tagId: true }),
    handler: async ({ api, body }) => {
      const tag = await api.tags.update({
        tagId: params.tagId,
        ...body!,
      });
      return { status: 200, resp: tag };
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
