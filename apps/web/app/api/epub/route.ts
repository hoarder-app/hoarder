import { inArray } from "drizzle-orm";
import epub, { Chapter } from "epub-gen-memory";

import { db } from "@hoarder/db";
import { bookmarkLinks } from "@hoarder/db/schema";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const assetIds = searchParams.getAll("assetId");

  if (!assetIds || assetIds.length === 0) {
    return new Response("", {
      status: 404,
    });
  }

  const bookmarkInformation = await db
    .select({
      title: bookmarkLinks.title,
      htmlContent: bookmarkLinks.htmlContent,
    })
    .from(bookmarkLinks)
    .where(inArray(bookmarkLinks.id, assetIds));

  if (!bookmarkInformation || bookmarkInformation.length === 0) {
    return new Response("", {
      status: 404,
    });
  }

  const chapters = bookmarkInformation.map((information) => {
    return {
      content: information.htmlContent ?? "",
      title: information.title ?? "",
    };
  });

  const title = getTitle(chapters);

  const generatedEpub = await epub(title, chapters);

  return new Response(generatedEpub, {
    status: 200,
    headers: {
      "Content-Type": "application/epub+zip",
      "Content-Disposition": `attachment; filename=${createFilename()}`,
    },
  });
}

function createFilename(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}-hoarder-bookmarks.epub`;
}

function getTitle(chapters: Chapter[]): string {
  if (chapters.length === 1 && chapters[0].title) {
    return chapters[0].title;
  }
  return "Hoarder EPub export";
}
