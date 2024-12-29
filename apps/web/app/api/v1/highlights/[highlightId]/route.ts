import { NextRequest } from "next/server";
import { buildHandler } from "@/app/api/v1/utils/handler";

import { zUpdateHighlightSchema } from "@hoarder/shared/types/highlights";

export const dynamic = "force-dynamic";

export const GET = (
  req: NextRequest,
  { params }: { params: { highlightId: string } },
) =>
  buildHandler({
    req,
    handler: async ({ api }) => {
      const highlight = await api.highlights.get({
        highlightId: params.highlightId,
      });
      return { status: 200, resp: highlight };
    },
  });

export const PATCH = (
  req: NextRequest,
  { params }: { params: { highlightId: string } },
) =>
  buildHandler({
    req,
    bodySchema: zUpdateHighlightSchema.omit({ highlightId: true }),
    handler: async ({ api, body }) => {
      const highlight = await api.highlights.update({
        highlightId: params.highlightId,
        ...body!,
      });
      return { status: 200, resp: highlight };
    },
  });

export const DELETE = (
  req: NextRequest,
  { params }: { params: { highlightId: string } },
) =>
  buildHandler({
    req,
    handler: async ({ api }) => {
      const highlight = await api.highlights.delete({
        highlightId: params.highlightId,
      });
      return { status: 200, resp: highlight };
    },
  });
