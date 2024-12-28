import { toExportFormat, zExportSchema } from "@/lib/exportBookmarks";
import { api, createContextFromRequest } from "@/server/api/client";
import { z } from "zod";

import { MAX_NUM_BOOKMARKS_PER_PAGE } from "@hoarder/shared/types/bookmarks";

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

  const exportData: z.infer<typeof zExportSchema> = {
    bookmarks: results.filter((b) => b.content !== null),
  };

  return new Response(JSON.stringify(exportData), {
    status: 200,
    headers: {
      "Content-type": "application/json",
      "Content-disposition": `attachment; filename="hoarder-export-${new Date().toISOString()}.json"`,
    },
  });
}
