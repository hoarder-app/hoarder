import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { stream } from "hono/streaming";
import { z } from "zod";

import { assets } from "@karakeep/db/schema";
import {
  createAssetReadStream,
  getAssetSize,
  readAssetMetadata,
} from "@karakeep/shared/assetdb";

import { authMiddleware } from "../middlewares/auth";
import { toWebReadableStream, uploadAsset } from "../utils/upload";

const app = new Hono()
  .use(authMiddleware)
  .post(
    "/",
    zValidator(
      "form",
      z
        .object({ file: z.instanceof(File) })
        .or(z.object({ image: z.instanceof(File) })),
    ),
    async (c) => {
      const body = c.req.valid("form");
      const up = await uploadAsset(c.var.ctx.user, c.var.ctx.db, body);
      if ("error" in up) {
        return c.json({ error: up.error }, up.status);
      }
      return c.json({
        assetId: up.assetId,
        contentType: up.contentType,
        size: up.size,
        fileName: up.fileName,
      });
    },
  )
  .get("/:assetId", async (c) => {
    const assetId = c.req.param("assetId");
    const assetDb = await c.var.ctx.db.query.assets.findFirst({
      where: and(eq(assets.id, assetId), eq(assets.userId, c.var.ctx.user.id)),
    });

    if (!assetDb) {
      return c.json({ error: "Asset not found" }, { status: 404 });
    }

    const [metadata, size] = await Promise.all([
      readAssetMetadata({
        userId: c.var.ctx.user.id,
        assetId,
      }),

      getAssetSize({
        userId: c.var.ctx.user.id,
        assetId,
      }),
    ]);

    const range = c.req.header("Range");
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : size - 1;

      const fStream = createAssetReadStream({
        userId: c.var.ctx.user.id,
        assetId,
        start,
        end,
      });
      c.status(206); // Partial Content
      c.header("Content-Range", `bytes ${start}-${end}/${size}`);
      c.header("Accept-Ranges", "bytes");
      c.header("Content-Length", (end - start + 1).toString());
      c.header("Content-type", metadata.contentType);
      return stream(c, async (stream) => {
        await stream.pipe(toWebReadableStream(fStream));
      });
    } else {
      const fStream = createAssetReadStream({
        userId: c.var.ctx.user.id,
        assetId,
      });
      c.status(200);
      c.header("Content-Length", size.toString());
      c.header("Content-type", metadata.contentType);
      return stream(c, async (stream) => {
        await stream.pipe(toWebReadableStream(fStream));
      });
    }
  });

export default app;
