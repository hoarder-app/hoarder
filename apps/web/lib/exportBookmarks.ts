import { z } from "zod";

import { BookmarkTypes, ZBookmark } from "@karakeep/shared/types/bookmarks";

export const zExportBookmarkSchema = z.object({
  createdAt: z.number(),
  title: z.string().nullable(),
  tags: z.array(z.string()),
  content: z
    .discriminatedUnion("type", [
      z.object({
        type: z.literal(BookmarkTypes.LINK),
        url: z.string(),
      }),
      z.object({
        type: z.literal(BookmarkTypes.TEXT),
        text: z.string(),
      }),
    ])
    .nullable(),
  note: z.string().nullable(),
});

export const zExportSchema = z.object({
  bookmarks: z.array(zExportBookmarkSchema),
});

export function toExportFormat(
  bookmark: ZBookmark,
): z.infer<typeof zExportBookmarkSchema> {
  let content = null;
  switch (bookmark.content.type) {
    case BookmarkTypes.LINK: {
      content = {
        type: bookmark.content.type,
        url: bookmark.content.url,
      };
      break;
    }
    case BookmarkTypes.TEXT: {
      content = {
        type: bookmark.content.type,
        text: bookmark.content.text,
      };
      break;
    }
    // Exclude asset types for now
  }
  return {
    createdAt: Math.floor(bookmark.createdAt.getTime() / 1000),
    title:
      bookmark.title ??
      (bookmark.content.type === BookmarkTypes.LINK
        ? (bookmark.content.title ?? null)
        : null),
    tags: bookmark.tags.map((t) => t.name),
    content,
    note: bookmark.note ?? null,
  };
}
