import { getServerAuthSession } from "@/server/auth";
import { and, eq } from "drizzle-orm";

import { db } from "@hoarder/db";
import { assets } from "@hoarder/db/schema";

export const dynamic = "force-dynamic";
export async function GET(
  request: Request,
  { params }: { params: { assetId: string } },
) {
  const session = await getServerAuthSession();
  if (!session) {
    return new Response(`Unauthorized`, {
      status: 401,
    });
  }
  const asset = await db.query.assets.findFirst({
    where: and(
      eq(assets.id, params.assetId),
      eq(assets.userId, session.user.id),
    ),
  });

  if (!asset) {
    return new Response(`Asset not found`, {
      status: 404,
    });
  }
  return new Response(asset.blob, {
    status: 200,
    headers: {
      "Content-type": asset.contentType,
    },
  });
}
