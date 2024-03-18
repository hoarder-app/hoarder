import { createContextFromRequest } from "@/server/api/client";
import { getServerAuthSession } from "@/server/auth";
import { and, eq } from "drizzle-orm";

import { db } from "@hoarder/db";
import { assets } from "@hoarder/db/schema";

export const dynamic = "force-dynamic";
export async function GET(
  request: Request,
  { params }: { params: { assetId: string } },
) {
  const ctx = await createContextFromRequest(request);
  if (!ctx.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const asset = await db.query.assets.findFirst({
    where: and(eq(assets.id, params.assetId), eq(assets.userId, ctx.user.id)),
  });

  if (!asset) {
    return Response.json({ error: "Asset not found" }, { status: 404 });
  }
  return new Response(asset.blob, {
    status: 200,
    headers: {
      "Content-type": asset.contentType,
    },
  });
}
