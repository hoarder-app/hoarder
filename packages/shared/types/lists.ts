import { z } from "zod";

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
