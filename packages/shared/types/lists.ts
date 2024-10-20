import { z } from "zod";

export const zNewBookmarkListSchema = z.object({
  name: z
    .string()
    .min(1, "List name can't be empty")
    .max(40, "List name is at most 40 chars"),
  icon: z.string(),
  parentId: z.string().nullish(),
});

export const zBookmarkListSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  parentId: z.string().nullable(),
});

export const zBookmarkListWithBookmarksSchema = zBookmarkListSchema.merge(
  z.object({
    bookmarks: z.array(z.string()),
  }),
);

export type ZBookmarkList = z.infer<typeof zBookmarkListSchema>;
export type ZBookmarkListWithBookmarks = z.infer<
  typeof zBookmarkListWithBookmarksSchema
>;
