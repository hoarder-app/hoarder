import { createContextFromRequest } from "@/server/api/client";
import { and, eq } from "drizzle-orm";
import sharp from "sharp";

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

  let finalAsset = asset;

  const { searchParams } = new URL(request.url);
  if (searchParams.has("preview")) {
    finalAsset = await cropImage(asset);
  }

  return new Response(finalAsset, {
    status: 200,
    headers: {
      "Content-type": metadata.contentType,
    },
  });
}

async function cropImage(buffer: Buffer): Promise<Buffer> {
  try {
    const metadata = await sharp(buffer).metadata();
    if (!metadata.height || metadata.height < 1000) {
      return buffer;
    }
    return await sharp(buffer)
      // cropping to 1000 pixels which is just a conservative guess and not something that is actually calculated
      .extract({ left: 0, top: 0, width: metadata.width!, height: 1000 })
      .toBuffer();
  } catch (error) {
    console.error("Error cropping image:", error);
    throw error;
  }
}
