import { z } from "zod";

import { zBookmarkTagSchema } from "./tags";

export const zBookmarkedLinkSchema = z.object({
  type: z.literal("link"),
  url: z.string().url(),
  title: z.string().nullish(),
  description: z.string().nullish(),
  imageUrl: z.string().url().nullish(),
  favicon: z.string().url().nullish(),
  htmlContent: z.string().nullish(),
  crawledAt: z.date().nullish(),
});
export type ZBookmarkedLink = z.infer<typeof zBookmarkedLinkSchema>;

export const zBookmarkedTextSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
});
export type ZBookmarkedText = z.infer<typeof zBookmarkedTextSchema>;

export const zBookmarkedAssetSchema = z.object({
  type: z.literal("asset"),
  assetType: z.enum(["image"]),
  assetId: z.string(),
});
export type ZBookmarkedAsset = z.infer<typeof zBookmarkedAssetSchema>;

export const zBookmarkContentSchema = z.discriminatedUnion("type", [
  zBookmarkedLinkSchema,
  zBookmarkedTextSchema,
  zBookmarkedAssetSchema,
  z.object({ type: z.literal("unknown") }),
]);
export type ZBookmarkContent = z.infer<typeof zBookmarkContentSchema>;

export const zBareBookmarkSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  archived: z.boolean(),
  favourited: z.boolean(),
  taggingStatus: z.enum(["success", "failure", "pending"]).nullable(),
  note: z.string().nullish(),
});

export const zBookmarkSchema = zBareBookmarkSchema.merge(
  z.object({
    tags: z.array(zBookmarkTagSchema),
    content: zBookmarkContentSchema,
  }),
);
export type ZBookmark = z.infer<typeof zBookmarkSchema>;

// POST /v1/bookmarks
export const zNewBookmarkRequestSchema = zBookmarkContentSchema;
export type ZNewBookmarkRequest = z.infer<typeof zNewBookmarkRequestSchema>;

// GET /v1/bookmarks

export const DEFAULT_NUM_BOOKMARKS_PER_PAGE = 20;

export const zGetBookmarksRequestSchema = z.object({
  ids: z.array(z.string()).optional(),
  archived: z.boolean().optional(),
  favourited: z.boolean().optional(),
  tagId: z.string().optional(),
  listId: z.string().optional(),
  limit: z.number().max(100).optional(),
  cursor: z.date().nullish(),
});
export type ZGetBookmarksRequest = z.infer<typeof zGetBookmarksRequestSchema>;

export const zGetBookmarksResponseSchema = z.object({
  bookmarks: z.array(zBookmarkSchema),
  nextCursor: z.date().nullable(),
});
export type ZGetBookmarksResponse = z.infer<typeof zGetBookmarksResponseSchema>;

// PATCH /v1/bookmarks/[bookmarkId]
export const zUpdateBookmarksRequestSchema = z.object({
  bookmarkId: z.string(),
  archived: z.boolean().optional(),
  favourited: z.boolean().optional(),
  note: z.string().optional(),
});
export type ZUpdateBookmarksRequest = z.infer<
  typeof zUpdateBookmarksRequestSchema
>;
