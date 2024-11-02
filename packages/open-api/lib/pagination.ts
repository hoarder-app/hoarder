import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { zBookmarkSchema } from "@hoarder/shared/types/bookmarks";

extendZodWithOpenApi(z);

export const BookmarkSchema = zBookmarkSchema.openapi("Bookmark");

export const PaginatedBookmarksSchema = z
  .object({
    bookmarks: z.array(BookmarkSchema),
    nextCursor: z.string().nullable(),
  })
  .openapi("PaginatedBookmarks");

export const CursorSchema = z.string().openapi("Cursor");

export const PaginationSchema = z
  .object({
    limit: z.number().optional(),
    cursor: CursorSchema.optional(),
  })
  .openapi("Pagination");
