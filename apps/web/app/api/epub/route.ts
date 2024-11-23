import { getServerAuthSession } from "@/server/auth";
import epub, { Chapter } from "@kamtschatka/epub-gen-memory";
import { and, eq, inArray } from "drizzle-orm";

import { db } from "@hoarder/db";
import { bookmarkLinks, bookmarks } from "@hoarder/db/schema";

export async function GET(request: Request) {
  const session = await getServerAuthSession();
  if (!session || !session.user) {
    return new Response("", {
      status: 401,
    });
  }

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
    .leftJoin(bookmarks, eq(bookmarks.id, bookmarkLinks.id))
    .where(
      and(
        eq(bookmarks.userId, session.user.id),
        inArray(bookmarkLinks.id, assetIds),
      ),
    );

  if (!bookmarkInformation || bookmarkInformation.length === 0) {
    return new Response("", {
      status: 404,
    });
  }

  const chapters: Chapter[] = bookmarkInformation.map((information) => {
    return {
      content: information.htmlContent ?? "",
      title: information.title ?? "",
    };
  });

  const title = getTitle(chapters);
  // If there is only 1 bookmark, we can skip the table of contents
  const tocInTOC = chapters.length > 1;

  const generatedEpub = await epub(
    {
      title,
      ignoreFailedDownloads: true,
      tocInTOC,
      version: 3,
      urlValidator,
    },
    chapters,
  );

  return new Response(generatedEpub, {
    status: 200,
    headers: {
      "Content-Type": "application/epub+zip",
      "Content-Disposition": `attachment; filename=${createFilename()}`,
    },
  });
}

function urlValidator(url: string): boolean {
  const urlParsed = new URL(url);
  if (urlParsed.protocol != "http:" && urlParsed.protocol != "https:") {
    return true;
  }
  return ["localhost", "127.0.0.1", "0.0.0.0"].includes(urlParsed.hostname);
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
