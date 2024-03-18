import { getServerAuthSession } from "@/server/auth";

import { db } from "@hoarder/db";
import { assets } from "@hoarder/db/schema";

const SUPPORTED_ASSET_TYPES = new Set(["image/jpeg", "image/png"]);

const MAX_UPLOAD_SIZE_BYTES = 4 * 1024 * 1024;

export const dynamic = "force-dynamic"; // defaults to auto
export async function POST(request: Request) {
  const session = await getServerAuthSession();
  if (!session) {
    return new Response(`Unauthorized`, {
      status: 401,
    });
  }
  const formData = await request.formData();
  const data = formData.get("image");
  let buffer;
  let contentType;
  if (data instanceof File) {
    contentType = data.type;
    if (!SUPPORTED_ASSET_TYPES.has(contentType)) {
      return new Response("Unsupported asset type", { status: 400 });
    }
    if (data.size > MAX_UPLOAD_SIZE_BYTES) {
      return new Response("Asset is too big", { status: 413 });
    }
    buffer = Buffer.from(await data.arrayBuffer());
  } else {
    return new Response("Bad Request", { status: 400 });
  }

  const [dbRes] = await db
    .insert(assets)
    .values({
      encoding: "binary",
      contentType: contentType,
      blob: buffer,
      userId: session.user.id,
    })
    .returning();

  return Response.json({
    assetId: dbRes.id,
    contentType: dbRes.contentType,
    size: buffer.byteLength,
  });
}
