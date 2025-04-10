import { z } from "zod";

import { parseSearchQuery } from "../searchQueryParser";

export const zNewBookmarkListSchema = z
  .object({
    name: z
      .string()
      .min(1, "List name can't be empty")
      .max(40, "List name is at most 40 chars"),
    icon: z.string(),
    type: z.enum(["manual", "smart"]).optional().default("manual"),
    query: z.string().min(1).optional(),
    parentId: z.string().nullish(),
  })
  .refine((val) => val.type === "smart" || !val.query, {
    message: "Manual lists cannot have a query",
    path: ["query"],
  })
  .refine((val) => val.type === "manual" || val.query, {
    message: "Smart lists must have a query",
    path: ["query"],
  })
  .refine(
    (val) => !val.query || parseSearchQuery(val.query).result === "full",
    {
      message: "Smart search query is not valid",
      path: ["query"],
    },
  )
  .refine((val) => !val.query || parseSearchQuery(val.query).text.length == 0, {
    message:
      "Smart lists cannot have unqualified terms (aka full text search terms) in the query",
    path: ["query"],
  });

export const zBookmarkListSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  parentId: z.string().nullable(),
  type: z.enum(["manual", "smart"]).default("manual"),
  query: z.string().nullish(),
});

export type ZBookmarkList = z.infer<typeof zBookmarkListSchema>;

export const zEditBookmarkListSchema = z.object({
  listId: z.string(),
  name: z
    .string()
    .min(1, "List name can't be empty")
    .max(40, "List name is at most 40 chars")
    .optional(),
  icon: z.string().optional(),
  parentId: z.string().nullish(),
  query: z.string().min(1).optional(),
});

export const zEditBookmarkListSchemaWithValidation = zEditBookmarkListSchema
  .refine((val) => val.parentId != val.listId, {
    message: "List can't be its own parent",
    path: ["parentId"],
  })
  .refine(
    (val) => !val.query || parseSearchQuery(val.query).result === "full",
    {
      message: "Smart search query is not valid",
      path: ["query"],
    },
  )
  .refine((val) => !val.query || parseSearchQuery(val.query).text.length == 0, {
    message:
      "Smart lists cannot have unqualified terms (aka full text search terms) in the query",
    path: ["query"],
  });

export const zMergeListSchema = z
  .object({
    sourceName: z.string(),
    sourceIcon: z.string(),
    listId: z.string().min(1, "Source list must be selected"),
    targetId: z.string().min(1, "Destination list must be selected"),
  })
  .refine((val) => val.listId !== val.targetId, {
    message: "Cannot merge a list into itself",
    path: ["targetId"],
  });

export type ZMergeList = z.infer<typeof zMergeListSchema>;

export const zMergeListResponseSchema = z.object({
  totalItems: z.number(),
  addedCount: z.number(),
  duplicateCount: z.number(),
  failedCount: z.number(),
});

export type ZMergeListResponse = z.infer<typeof zMergeListResponseSchema>;
