import { NextRequest } from "next/server";
import { buildHandler } from "@/app/api/v1/utils/handler";

import { zNewHighlightSchema } from "@hoarder/shared/types/highlights";

import { adaptPagination, zPagination } from "../utils/pagination";

export const dynamic = "force-dynamic";

export const GET = (req: NextRequest) =>
  buildHandler({
    req,
    searchParamsSchema: zPagination,
    handler: async ({ api, searchParams }) => {
      const resp = await api.highlights.getAll({
        ...searchParams,
      });
      return { status: 200, resp: adaptPagination(resp) };
    },
  });

export const POST = (req: NextRequest) =>
  buildHandler({
    req,
    bodySchema: zNewHighlightSchema,
    handler: async ({ body, api }) => {
      const resp = await api.highlights.create(body!);
      return { status: 201, resp };
    },
  });
