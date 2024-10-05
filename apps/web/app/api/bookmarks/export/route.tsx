import { api, createContextFromRequest } from "@/server/api/client";

import type { ZBookmark } from "@hoarder/shared/types/bookmarks";
import {
  BookmarkTypes,
  MAX_NUM_BOOKMARKS_PER_PAGE,
} from "@hoarder/shared/types/bookmarks";

function toExportFormat(bookmark: ZBookmark) {
  return {
    createdAt: bookmark.createdAt.toISOString(),
    title:
      bookmark.title ??
      (bookmark.content.type === BookmarkTypes.LINK
        ? bookmark.content.title
        : null),
    tags: bookmark.tags.map((t) => t.name),
    type: bookmark.content.type,
    url:
      bookmark.content.type === BookmarkTypes.LINK
        ? bookmark.content.url
        : undefined,
    text:
      bookmark.content.type === BookmarkTypes.TEXT
        ? bookmark.content.text
        : undefined,
    note: bookmark.note,
  };
}

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const ctx = await createContextFromRequest(request);
  if (!ctx.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const req = {
    limit: MAX_NUM_BOOKMARKS_PER_PAGE,
    useCursorV2: true,
  };

  let resp = await api.bookmarks.getBookmarks(req);
  let results = resp.bookmarks.map(toExportFormat);

  while (resp.nextCursor) {
    resp = await api.bookmarks.getBookmarks({
      ...request,
      cursor: resp.nextCursor,
    });
    results = [...results, ...resp.bookmarks.map(toExportFormat)];
  }

  return new Response(
    JSON.stringify({
      // Exclude asset types for now
      bookmarks: results.filter((b) => b.type !== BookmarkTypes.ASSET),
    }),
    {
      status: 200,
      headers: {
        "Content-type": "application/json",
        "Content-disposition": `attachment; filename="hoarder-export-${new Date().toISOString()}.json"`,
      },
    },
  );
}
