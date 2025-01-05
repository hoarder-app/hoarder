import { createContextFromRequest } from "@/server/api/client";
import { and, eq } from "drizzle-orm";

import { assets } from "@hoarder/db/schema";
import {
  createAssetReadStream,
  getAssetSize,
  readAssetMetadata,
} from "@hoarder/shared/assetdb";

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

  const [metadata, size] = await Promise.all([
    readAssetMetadata({
      userId: ctx.user.id,
      assetId: params.assetId,
    }),

    getAssetSize({
      userId: ctx.user.id,
      assetId: params.assetId,
    }),
  ]);

  const range = request.headers.get("Range");
  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : size - 1;

    const stream = createAssetReadStream({
      userId: ctx.user.id,
      assetId: params.assetId,
      start,
      end,
    });

    return new Response(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      stream as any,
      {
        status: 206, // Partial Content
        headers: {
          "Content-Range": `bytes ${start}-${end}/${size}`,
          "Accept-Ranges": "bytes",
          "Content-Length": (end - start + 1).toString(),
          "Content-type": metadata.contentType,
        },
      },
    );
  } else {
    const stream = createAssetReadStream({
      userId: ctx.user.id,
      assetId: params.assetId,
    });

    return new Response(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      stream as any,
      {
        status: 200,
        headers: {
          "Content-Length": size.toString(),
          "Content-type": metadata.contentType,
        },
      },
    );
  }
}
