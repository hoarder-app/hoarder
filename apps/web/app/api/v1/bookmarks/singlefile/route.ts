import { createContextFromRequest } from "@/server/api/client";
import { TRPCError } from "@trpc/server";

import serverConfig from "@hoarder/shared/config";
import { BookmarkTypes } from "@hoarder/shared/types/bookmarks";
import { createCallerFactory } from "@hoarder/trpc";
import { appRouter } from "@hoarder/trpc/routers/_app";

import { uploadFromPostData } from "../../../assets/route";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ctx = await createContextFromRequest(req);
  if (!ctx.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (serverConfig.demoMode) {
    throw new TRPCError({
      message: "Mutations are not allowed in demo mode",
      code: "FORBIDDEN",
    });
  }
  const formData = await req.formData();
  const up = await uploadFromPostData(ctx.user, ctx.db, formData);

  if ("error" in up) {
    return Response.json({ error: up.error }, { status: up.status });
  }

  const url = formData.get("url");
  if (!url) {
    throw new TRPCError({
      message: "URL is required",
      code: "BAD_REQUEST",
    });
  }
  if (typeof url !== "string") {
    throw new TRPCError({
      message: "URL must be a string",
      code: "BAD_REQUEST",
    });
  }

  const createCaller = createCallerFactory(appRouter);
  const api = createCaller(ctx);

  const bookmark = await api.bookmarks.createBookmark({
    type: BookmarkTypes.LINK,
    url,
    precrawledArchiveId: up.assetId,
  });
  return Response.json(bookmark, { status: 201 });
}
