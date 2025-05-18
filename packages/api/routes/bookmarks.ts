import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import {
  BookmarkTypes,
  zAssetSchema,
  zManipulatedTagSchema,
  zNewBookmarkRequestSchema,
  zUpdateBookmarksRequestSchema,
} from "@karakeep/shared/types/bookmarks";

import { authMiddleware } from "../middlewares/auth";
import { adaptPagination, zPagination } from "../utils/pagination";
import {
  zGetBookmarkQueryParamsSchema,
  zGetBookmarkSearchParamsSchema,
  zIncludeContentSearchParamsSchema,
  zStringBool,
} from "../utils/types";
import { uploadAsset } from "../utils/upload";

const app = new Hono()
  .use(authMiddleware)

  // GET /bookmarks
  .get(
    "/",
    zValidator(
      "query",
      z
        .object({
          favourited: zStringBool.optional(),
          archived: zStringBool.optional(),
        })
        .and(zGetBookmarkQueryParamsSchema)
        .and(zPagination),
    ),
    async (c) => {
      const searchParams = c.req.valid("query");
      const bookmarks = await c.var.api.bookmarks.getBookmarks(searchParams);
      return c.json(adaptPagination(bookmarks), 200);
    },
  )

  // POST /bookmarks
  .post("/", zValidator("json", zNewBookmarkRequestSchema), async (c) => {
    const body = c.req.valid("json");
    const bookmark = await c.var.api.bookmarks.createBookmark(body);
    return c.json(bookmark, 201);
  })

  // GET /bookmarks/search
  .get(
    "/search",
    zValidator(
      "query",
      z
        .object({
          q: z.string(),
          limit: z.coerce.number().optional(),
          cursor: z
            .string()
            .optional()
            .transform((val) =>
              val ? { ver: 1 as const, offset: parseInt(val) } : undefined,
            ),
        })
        .and(zGetBookmarkSearchParamsSchema),
    ),
    async (c) => {
      const searchParams = c.req.valid("query");
      const bookmarks = await c.var.api.bookmarks.searchBookmarks({
        text: searchParams.q,
        cursor: searchParams.cursor,
        limit: searchParams.limit,
        includeContent: searchParams.includeContent,
      });
      return c.json(
        {
          bookmarks: bookmarks.bookmarks,
          nextCursor: bookmarks.nextCursor
            ? `${bookmarks.nextCursor.offset}`
            : null,
        },
        200,
      );
    },
  )
  .post(
    "/singlefile",
    zValidator(
      "form",
      z.object({
        url: z.string(),
        file: z.instanceof(File),
      }),
    ),
    async (c) => {
      const form = c.req.valid("form");
      const up = await uploadAsset(c.var.ctx.user, c.var.ctx.db, form);
      if ("error" in up) {
        return c.json({ error: up.error }, up.status);
      }
      const bookmark = await c.var.api.bookmarks.createBookmark({
        type: BookmarkTypes.LINK,
        url: form.url,
        precrawledArchiveId: up.assetId,
      });
      return c.json(bookmark, 201);
    },
  )

  // GET /bookmarks/[bookmarkId]
  .get(
    "/:bookmarkId",
    zValidator("query", zIncludeContentSearchParamsSchema),
    async (c) => {
      const bookmarkId = c.req.param("bookmarkId");
      const searchParams = c.req.valid("query");
      const bookmark = await c.var.api.bookmarks.getBookmark({
        bookmarkId,
        includeContent: searchParams.includeContent,
      });
      return c.json(bookmark, 200);
    },
  )

  // PATCH /bookmarks/[bookmarkId]
  .patch(
    "/:bookmarkId",
    zValidator(
      "json",
      zUpdateBookmarksRequestSchema.omit({ bookmarkId: true }),
    ),
    async (c) => {
      const bookmarkId = c.req.param("bookmarkId");
      const body = c.req.valid("json");
      const bookmark = await c.var.api.bookmarks.updateBookmark({
        bookmarkId,
        ...body,
      });
      return c.json(bookmark, 200);
    },
  )

  // DELETE /bookmarks/[bookmarkId]
  .delete("/:bookmarkId", async (c) => {
    const bookmarkId = c.req.param("bookmarkId");
    await c.var.api.bookmarks.deleteBookmark({ bookmarkId });
    return c.body(null, 204);
  })

  // GET /bookmarks/[bookmarkId]/lists
  .get("/:bookmarkId/lists", async (c) => {
    const bookmarkId = c.req.param("bookmarkId");
    const resp = await c.var.api.lists.getListsOfBookmark({ bookmarkId });
    return c.json(resp, 200);
  })

  // GET /bookmarks/[bookmarkId]/assets
  .get("/:bookmarkId/assets", async (c) => {
    const bookmarkId = c.req.param("bookmarkId");
    const resp = await c.var.api.bookmarks.getBookmark({ bookmarkId });
    return c.json({ assets: resp.assets }, 200);
  })

  // POST /bookmarks/[bookmarkId]/assets
  .post("/:bookmarkId/assets", zValidator("json", zAssetSchema), async (c) => {
    const bookmarkId = c.req.param("bookmarkId");
    const body = c.req.valid("json");
    const asset = await c.var.api.assets.attachAsset({
      bookmarkId,
      asset: body,
    });
    return c.json(asset, 201);
  })

  // PUT /bookmarks/[bookmarkId]/assets/[assetId]
  .put(
    "/:bookmarkId/assets/:assetId",
    zValidator("json", z.object({ assetId: z.string() })),
    async (c) => {
      const bookmarkId = c.req.param("bookmarkId");
      const assetId = c.req.param("assetId");
      const body = c.req.valid("json");
      await c.var.api.assets.replaceAsset({
        bookmarkId,
        oldAssetId: assetId,
        newAssetId: body.assetId,
      });
      return c.body(null, 204);
    },
  )

  // DELETE /bookmarks/[bookmarkId]/assets/[assetId]
  .delete("/:bookmarkId/assets/:assetId", async (c) => {
    const bookmarkId = c.req.param("bookmarkId");
    const assetId = c.req.param("assetId");
    await c.var.api.assets.detachAsset({ bookmarkId, assetId });
    return c.body(null, 204);
  })

  // POST /bookmarks/[bookmarkId]/tags
  .post(
    "/:bookmarkId/tags",
    zValidator("json", z.object({ tags: z.array(zManipulatedTagSchema) })),
    async (c) => {
      const bookmarkId = c.req.param("bookmarkId");
      const body = c.req.valid("json");
      const resp = await c.var.api.bookmarks.updateTags({
        bookmarkId,
        attach: body.tags,
        detach: [],
      });
      return c.json({ attached: resp.attached }, 200);
    },
  )

  // DELETE /bookmarks/[bookmarkId]/tags
  .delete(
    "/:bookmarkId/tags",
    zValidator("json", z.object({ tags: z.array(zManipulatedTagSchema) })),
    async (c) => {
      const bookmarkId = c.req.param("bookmarkId");
      const body = c.req.valid("json");
      const resp = await c.var.api.bookmarks.updateTags({
        bookmarkId,
        detach: body.tags,
        attach: [],
      });
      return c.json({ detached: resp.detached }, 200);
    },
  )

  // POST /bookmarks/[bookmarkId]/summarize
  .post("/:bookmarkId/summarize", async (c) => {
    const bookmarkId = c.req.param("bookmarkId");
    const bookmark = await c.var.api.bookmarks.summarizeBookmark({
      bookmarkId,
    });
    return c.json(bookmark, 200);
  })

  // GET /bookmarks/[bookmarkId]/highlights
  .get("/:bookmarkId/highlights", async (c) => {
    const bookmarkId = c.req.param("bookmarkId");
    const resp = await c.var.api.highlights.getForBookmark({ bookmarkId });
    return c.json(resp, 200);
  });

export default app;
