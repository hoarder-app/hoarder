import { createContextFromRequest } from "@/server/api/client";
import { TRPCError } from "@trpc/server";

import type { ZUploadResponse } from "@hoarder/shared/types/uploads";
import {
  newAssetId,
  saveAsset,
  SUPPORTED_UPLOAD_ASSET_TYPES,
} from "@hoarder/shared/assetdb";
import serverConfig from "@hoarder/shared/config";

const MAX_UPLOAD_SIZE_BYTES = serverConfig.maxAssetSizeMb * 1024 * 1024;

export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const ctx = await createContextFromRequest(request);
  if (!ctx.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (serverConfig.demoMode) {
    throw new TRPCError({
      message: "Mutations are not allowed in demo mode",
      code: "FORBIDDEN",
    });
  }
  const formData = await request.formData();
  const data = formData.get("file") ?? formData.get("image");
  let buffer;
  let contentType;
  if (data instanceof File) {
    contentType = data.type;
    if (!SUPPORTED_UPLOAD_ASSET_TYPES.has(contentType)) {
      return Response.json(
        { error: "Unsupported asset type" },
        { status: 400 },
      );
    }
    if (data.size > MAX_UPLOAD_SIZE_BYTES) {
      return Response.json({ error: "Asset is too big" }, { status: 413 });
    }
    buffer = Buffer.from(await data.arrayBuffer());
  } else {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }

  const assetId = newAssetId();
  const fileName = data.name;

  await saveAsset({
    userId: ctx.user.id,
    assetId,
    metadata: { contentType, fileName },
    asset: buffer,
  });

  return Response.json({
    assetId,
    contentType,
    size: buffer.byteLength,
    fileName,
  } satisfies ZUploadResponse);
}
