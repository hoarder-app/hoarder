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
import { AuthedContext } from "@hoarder/trpc";

const MAX_UPLOAD_SIZE_BYTES = serverConfig.maxAssetSizeMb * 1024 * 1024;

export const dynamic = "force-dynamic";

export async function uploadFromPostData(
  user: AuthedContext["user"],
  db: AuthedContext["db"],
  formData: FormData,
): Promise<
  | { error: string; status: number }
  | {
      assetId: string;
      contentType: string;
      fileName: string;
      size: number;
    }
> {
  const data = formData.get("file") ?? formData.get("image");
  let buffer;
  let contentType;
  if (data instanceof File) {
    contentType = data.type;
    if (!SUPPORTED_UPLOAD_ASSET_TYPES.has(contentType)) {
      return { error: "Unsupported asset type", status: 400 };
    }
    if (data.size > MAX_UPLOAD_SIZE_BYTES) {
      return { error: "Asset is too big", status: 413 };
    }
    buffer = Buffer.from(await data.arrayBuffer());
  } else {
    return { error: "Bad request", status: 400 };
  }

  const fileName = data.name;
  const [assetDb] = await db
    .insert(assets)
    .values({
      id: newAssetId(),
      // Initially, uploads are uploaded for unknown purpose
      // And without an attached bookmark.
      assetType: AssetTypes.UNKNOWN,
      bookmarkId: null,
      userId: user.id,
      contentType,
      size: data.size,
      fileName,
    })
    .returning();

  await saveAsset({
    userId: user.id,
    assetId: assetDb.id,
    metadata: { contentType, fileName },
    asset: buffer,
  });

  return {
    assetId: assetDb.id,
    contentType,
    size: buffer.byteLength,
    fileName,
  };
}

export async function POST(request: Request) {
  const ctx = await createContextFromRequest(request);
  if (ctx.user === null) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (serverConfig.demoMode) {
    throw new TRPCError({
      message: "Mutations are not allowed in demo mode",
      code: "FORBIDDEN",
    });
  }
  const formData = await request.formData();

  const resp = await uploadFromPostData(ctx.user, ctx.db, formData);
  if ("error" in resp) {
    return Response.json({ error: resp.error }, { status: resp.status });
  }

  return Response.json({
    assetId: resp.assetId,
    contentType: resp.contentType,
    size: resp.size,
    fileName: resp.fileName,
  } satisfies ZUploadResponse);
}
