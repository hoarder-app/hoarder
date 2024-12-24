import { NextRequest } from "next/server";
import { buildHandler } from "@/app/api/v1/utils/handler";

import { zUpdateTagRequestSchema } from "@hoarder/shared/types/tags";

export const dynamic = "force-dynamic";

export const GET = async (req: NextRequest, props: { params: Promise<{ tagId: string }> }) => {
  const params = await props.params;

  return buildHandler({
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
};

export const PATCH = async (req: NextRequest, props: { params: Promise<{ tagId: string }> }) => {
  const params = await props.params;

  return buildHandler({
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
};

export const DELETE = async (req: NextRequest, props: { params: Promise<{ tagId: string }> }) => {
  const params = await props.params;

  return buildHandler({
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
};
