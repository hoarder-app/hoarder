import { createContextFromRequest } from "@/server/api/client";
import { TRPCError } from "@trpc/server";

import type { ZUploadResponse } from "@hoarder/shared/types/uploads";
import { assets, AssetTypes } from "@hoarder/db/schema";
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

  const userId = ctx.user.id;
  const files = [...formData.getAll("file"), ...formData.getAll("image")];

  const promises = files.map(async (data) => {
    let buffer;
    let contentType;
    if (data instanceof File) {
      contentType = data.type;
      if (!SUPPORTED_UPLOAD_ASSET_TYPES.has(contentType)) {
        throw Response.json(
          { error: "Unsupported asset type" },
          { status: 400 },
        );
      }
      if (data.size > MAX_UPLOAD_SIZE_BYTES) {
        throw Response.json({ error: "Asset is too big" }, { status: 413 });
      }
      buffer = Buffer.from(await data.arrayBuffer());
    } else {
      throw Response.json({ error: "Bad request" }, { status: 400 });
    }

    const fileName = data.name;
    const [assetDb] = await ctx.db
      .insert(assets)
      .values({
        id: newAssetId(),
        // Initially, uploads are uploaded for unknown purpose
        // And without an attached bookmark.
        assetType: AssetTypes.UNKNOWN,
        bookmarkId: null,
        userId,
        contentType,
        size: data.size,
        fileName,
      })
      .returning();
    const assetId = assetDb.id;

    await saveAsset({
      userId,
      assetId,
      metadata: { contentType, fileName },
      asset: buffer,
    });

    return {
      assetId,
      contentType,
      size: buffer.byteLength,
      fileName,
    } satisfies ZUploadResponse[number];
  });

  try {
    return Response.json(await Promise.all(promises));
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    throw error;
  }
}
