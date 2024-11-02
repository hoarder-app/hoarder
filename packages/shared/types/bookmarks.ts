import { z } from "zod";

import { zBookmarkTagSchema } from "./tags";

const MAX_TITLE_LENGTH = 250;

export const enum BookmarkTypes {
  LINK = "link",
  TEXT = "text",
  ASSET = "asset",
  UNKNOWN = "unknown",
}

export const zAssetTypesSchema = z.enum([
  "screenshot",
  "bannerImage",
  "fullPageArchive",
  "bookmarkAsset",
  "unknown",
]);
export type ZAssetType = z.infer<typeof zAssetTypesSchema>;

export const zAssetSchema = z.object({
  id: z.string(),
  assetType: zAssetTypesSchema,
});

export const zBookmarkedLinkSchema = z.object({
  type: z.literal(BookmarkTypes.LINK),
  url: z.string().url(),
  title: z.string().nullish(),
  description: z.string().nullish(),
  imageUrl: z.string().url().nullish(),
  imageAssetId: z.string().nullish(),
  screenshotAssetId: z.string().nullish(),
  fullPageArchiveAssetId: z.string().nullish(),
  favicon: z.string().url().nullish(),
  htmlContent: z.string().nullish(),
  crawledAt: z.date().nullish(),
});
export type ZBookmarkedLink = z.infer<typeof zBookmarkedLinkSchema>;

export const zBookmarkedTextSchema = z.object({
  type: z.literal(BookmarkTypes.TEXT),
  text: z.string(),
  sourceUrl: z.string().nullish(),
});
export type ZBookmarkedText = z.infer<typeof zBookmarkedTextSchema>;

export const zBookmarkedAssetSchema = z.object({
  type: z.literal(BookmarkTypes.ASSET),
  assetType: z.enum(["image", "pdf"]),
  assetId: z.string(),
  fileName: z.string().nullish(),
  sourceUrl: z.string().nullish(),
});
export type ZBookmarkedAsset = z.infer<typeof zBookmarkedAssetSchema>;

export const zBookmarkContentSchema = z.discriminatedUnion("type", [
  zBookmarkedLinkSchema,
  zBookmarkedTextSchema,
  zBookmarkedAssetSchema,
  z.object({ type: z.literal(BookmarkTypes.UNKNOWN) }),
]);
export type ZBookmarkContent = z.infer<typeof zBookmarkContentSchema>;

export const zBareBookmarkSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  title: z.string().max(MAX_TITLE_LENGTH).nullish(),
  archived: z.boolean(),
  favourited: z.boolean(),
  taggingStatus: z.enum(["success", "failure", "pending"]).nullable(),
  note: z.string().nullish(),
});

export const zBookmarkSchema = zBareBookmarkSchema.merge(
  z.object({
    tags: z.array(zBookmarkTagSchema),
    content: zBookmarkContentSchema,
    assets: z.array(zAssetSchema),
  }),
);
export type ZBookmark = z.infer<typeof zBookmarkSchema>;

const zBookmarkTypeLinkSchema = zBareBookmarkSchema.merge(
  z.object({
    tags: z.array(zBookmarkTagSchema),
    content: zBookmarkedLinkSchema,
    assets: z.array(zAssetSchema),
  }),
);
export type ZBookmarkTypeLink = z.infer<typeof zBookmarkTypeLinkSchema>;

const zBookmarkTypeTextSchema = zBareBookmarkSchema.merge(
  z.object({
    tags: z.array(zBookmarkTagSchema),
    content: zBookmarkedTextSchema,
    assets: z.array(zAssetSchema),
  }),
);
export type ZBookmarkTypeText = z.infer<typeof zBookmarkTypeTextSchema>;

const zBookmarkTypeAssetSchema = zBareBookmarkSchema.merge(
  z.object({
    tags: z.array(zBookmarkTagSchema),
    content: zBookmarkedAssetSchema,
    assets: z.array(zAssetSchema),
  }),
);
export type ZBookmarkTypeAsset = z.infer<typeof zBookmarkTypeAssetSchema>;

// POST /v1/bookmarks
export const zNewBookmarkRequestSchema = zBookmarkContentSchema;
export type ZNewBookmarkRequest = z.infer<typeof zNewBookmarkRequestSchema>;

// GET /v1/bookmarks

export const DEFAULT_NUM_BOOKMARKS_PER_PAGE = 20;
export const MAX_NUM_BOOKMARKS_PER_PAGE = 100;

export const zCursorV2 = z.object({
  createdAt: z.date(),
  id: z.string(),
});

export const zGetBookmarksRequestSchema = z.object({
  ids: z.array(z.string()).optional(),
  archived: z.boolean().optional(),
  favourited: z.boolean().optional(),
  tagId: z.string().optional(),
  listId: z.string().optional(),
  limit: z.number().max(MAX_NUM_BOOKMARKS_PER_PAGE).optional(),
  cursor: zCursorV2.nullish(),
  // TODO: This was done for backward comptability. At this point, all clients should be settings this to true.
  // The value is currently not being used, but keeping it so that client can still set it to true for older
  // servers.
  useCursorV2: z.boolean().optional(),
});
export type ZGetBookmarksRequest = z.infer<typeof zGetBookmarksRequestSchema>;

export const zGetBookmarksResponseSchema = z.object({
  bookmarks: z.array(zBookmarkSchema),
  nextCursor: zCursorV2.nullable(),
});
export type ZGetBookmarksResponse = z.infer<typeof zGetBookmarksResponseSchema>;

// PATCH /v1/bookmarks/[bookmarkId]
export const zUpdateBookmarksRequestSchema = z.object({
  bookmarkId: z.string(),
  archived: z.boolean().optional(),
  favourited: z.boolean().optional(),
  note: z.string().optional(),
  title: z.string().max(MAX_TITLE_LENGTH).nullish(),
  createdAt: z.date().optional(),
});
export type ZUpdateBookmarksRequest = z.infer<
  typeof zUpdateBookmarksRequestSchema
>;

// The schema that's used to for attachig/detaching tags
export const zManipulatedTagSchema = z
  .object({
    // At least one of the two must be set
    tagId: z.string().optional(), // If the tag already exists and we know its id we should pass it
    tagName: z.string().optional(),
  })
  .refine((val) => !!val.tagId || !!val.tagName, {
    message: "You must provide either a tagId or a tagName",
    path: ["tagId", "tagName"],
  });
