import { createContextFromRequest } from "@/server/api/client";
import { and, eq } from "drizzle-orm";

import { assets } from "@hoarder/db/schema";
import { readAsset } from "@hoarder/shared/assetdb";

export const dynamic = "force-dynamic";
export async function GET(
  request: Request,
  { params }: { params: { assetId: string } },
) {
  const ctx = await createContextFromRequest(request);
  if (!ctx.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const assetDb = await ctx.db.query.assets.findFirst({
    where: and(eq(assets.id, params.assetId), eq(assets.userId, ctx.user.id)),
  });

  if (!assetDb) {
    return Response.json({ error: "Asset not found" }, { status: 404 });
  }

  const { asset, metadata } = await readAsset({
    userId: ctx.user.id,
    assetId: params.assetId,
  });

  return new Response(asset, {
    status: 200,
    headers: {
      "Content-type": metadata.contentType,
    },
  });
}
