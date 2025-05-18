import { z } from "zod";

import { zSortOrder } from "@karakeep/shared/types/bookmarks";

export const zStringBool = z
  .string()
  .refine((val) => val === "true" || val === "false", "Must be true or false")
  .transform((val) => val === "true");

export const zGetBookmarkQueryParamsSchema = z.object({
  sortOrder: zSortOrder
    .exclude([zSortOrder.Enum.relevance])
    .optional()
    .default(zSortOrder.Enum.desc),
  // TODO: Change the default to false in a couple of releases.
  includeContent: zStringBool.optional().default("true"),
});

export const zGetBookmarkSearchParamsSchema = z.object({
  sortOrder: zSortOrder.optional().default(zSortOrder.Enum.relevance),
  // TODO: Change the default to false in a couple of releases.
  includeContent: zStringBool.optional().default("true"),
});
