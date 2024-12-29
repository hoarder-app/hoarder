import { NextRequest } from "next/server";
import { buildHandler } from "@/app/api/v1/utils/handler";
import { z } from "zod";

import { zManipulatedTagSchema } from "@hoarder/shared/types/bookmarks";

export const dynamic = "force-dynamic";

export const POST = (
  req: NextRequest,
  params: { params: { bookmarkId: string } },
) =>
  buildHandler({
    req,
    bodySchema: z.object({
      tags: z.array(zManipulatedTagSchema),
    }),
    handler: async ({ api, body }) => {
      const resp = await api.bookmarks.updateTags({
        bookmarkId: params.params.bookmarkId,
        attach: body!.tags,
        detach: [],
      });
      return { status: 200, resp: { attached: resp.attached } };
    },
  });

export const DELETE = (
  req: NextRequest,
  params: { params: { bookmarkId: string } },
) =>
  buildHandler({
    req,
    bodySchema: z.object({
      tags: z.array(zManipulatedTagSchema),
    }),
    handler: async ({ api, body }) => {
      const resp = await api.bookmarks.updateTags({
        bookmarkId: params.params.bookmarkId,
        detach: body!.tags,
        attach: [],
      });
      return { status: 200, resp: { detached: resp.detached } };
    },
  });
