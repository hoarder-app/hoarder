import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { createContextFromRequest } from "@/server/api/client";
import { TRPCError } from "@trpc/server";

import type { ZUploadResponse } from "@karakeep/shared/types/uploads";
import { assets, AssetTypes } from "@karakeep/db/schema";
import {
  newAssetId,
  saveAssetFromFile,
  SUPPORTED_UPLOAD_ASSET_TYPES,
} from "@karakeep/shared/assetdb";
import serverConfig from "@karakeep/shared/config";
import { AuthedContext } from "@karakeep/trpc";

const MAX_UPLOAD_SIZE_BYTES = serverConfig.maxAssetSizeMb * 1024 * 1024;

export const dynamic = "force-dynamic";

// Helper to convert Web Stream to Node Stream (requires Node >= 16.5 / 14.18)
function webStreamToNode(webStream: ReadableStream<Uint8Array>): Readable {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
  return Readable.fromWeb(webStream as any); // Type assertion might be needed
}

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

  if (!(data instanceof File)) {
    return { error: "Bad request", status: 400 };
  }

  const contentType = data.type;
  const fileName = data.name;
  if (!SUPPORTED_UPLOAD_ASSET_TYPES.has(contentType)) {
    return { error: "Unsupported asset type", status: 400 };
  }
  if (data.size > MAX_UPLOAD_SIZE_BYTES) {
    return { error: "Asset is too big", status: 413 };
  }

  let tempFilePath: string | undefined;

  try {
    tempFilePath = path.join(os.tmpdir(), `karakeep-upload-${Date.now()}`);
    await pipeline(
      webStreamToNode(data.stream()),
      fs.createWriteStream(tempFilePath),
    );
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

    await saveAssetFromFile({
      userId: user.id,
      assetId: assetDb.id,
      assetPath: tempFilePath,
      metadata: { contentType, fileName },
    });

    return {
      assetId: assetDb.id,
      contentType,
      size: data.size,
      fileName,
    };
  } finally {
    if (tempFilePath) {
      await fs.promises.unlink(tempFilePath).catch(() => ({}));
    }
  }
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
