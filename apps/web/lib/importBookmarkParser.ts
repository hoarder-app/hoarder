// Copied from https://gist.github.com/devster31/4e8c6548fd16ffb75c02e6f24e27f9b9
import * as cheerio from "cheerio";
import { parse } from "csv-parse/sync";
import { z } from "zod";

import { BookmarkTypes } from "@hoarder/shared/types/bookmarks";

import { zExportSchema } from "./exportBookmarks";

export interface ParsedBookmark {
  title: string;
  content?:
    | { type: BookmarkTypes.LINK; url: string }
    | { type: BookmarkTypes.TEXT; text: string };
  tags: string[];
  addDate?: number;
  notes?: string;
}

export async function parseNetscapeBookmarkFile(
  file: File,
): Promise<ParsedBookmark[]> {
  const textContent = await file.text();

  if (!textContent.startsWith("<!DOCTYPE NETSCAPE-Bookmark-file-1>")) {
    throw Error("The uploaded html file does not seem to be a bookmark file");
  }

  const $ = cheerio.load(textContent);

  return $("a")
    .map(function (_index, a) {
      const $a = $(a);
      const addDate = $a.attr("add_date");
      let tags: string[] = [];

      const tagsStr = $a.attr("tags");
      try {
        tags = tagsStr && tagsStr.length > 0 ? tagsStr.split(",") : [];
      } catch (e) {
        /* empty */
      }
      const url = $a.attr("href");
      return {
        title: $a.text(),
        content: url ? { type: BookmarkTypes.LINK as const, url } : undefined,
        tags,
        addDate: typeof addDate === "undefined" ? undefined : parseInt(addDate),
      };
    })
    .get();
}

export async function parsePocketBookmarkFile(
  file: File,
): Promise<ParsedBookmark[]> {
  const textContent = await file.text();

  const records = parse(textContent, {
    columns: true,
    skip_empty_lines: true,
  }) as {
    title: string;
    url: string;
    time_added: string;
    tags: string;
  }[];

  return records.map((record) => {
    return {
      title: record.title,
      content: { type: BookmarkTypes.LINK as const, url: record.url },
      tags: record.tags.length > 0 ? record.tags.split("|") : [],
      addDate: parseInt(record.time_added),
    };
  });
}

export async function parseHoarderBookmarkFile(
  file: File,
): Promise<ParsedBookmark[]> {
  const textContent = await file.text();

  const parsed = zExportSchema.safeParse(JSON.parse(textContent));
  if (!parsed.success) {
    throw new Error(
      `The uploaded JSON file contains an invalid bookmark file: ${parsed.error.toString()}`,
    );
  }

  return parsed.data.bookmarks.map((bookmark) => {
    let content = undefined;
    if (bookmark.content?.type == BookmarkTypes.LINK) {
      content = {
        type: BookmarkTypes.LINK as const,
        url: bookmark.content.url,
      };
    } else if (bookmark.content?.type == BookmarkTypes.TEXT) {
      content = {
        type: BookmarkTypes.TEXT as const,
        text: bookmark.content.text,
      };
    }
    return {
      title: bookmark.title ?? "",
      content,
      tags: bookmark.tags,
      addDate: bookmark.createdAt,
      notes: bookmark.note ?? undefined,
    };
  });
}

export async function parseOmnivoreBookmarkFile(
  file: File,
): Promise<ParsedBookmark[]> {
  const textContent = await file.text();
  const zOmnivoreExportSchema = z.array(
    z.object({
      title: z.string(),
      url: z.string(),
      labels: z.array(z.string()),
      savedAt: z.coerce.date(),
    }),
  );

  const parsed = zOmnivoreExportSchema.safeParse(JSON.parse(textContent));
  if (!parsed.success) {
    throw new Error(
      `The uploaded JSON file contains an invalid omnivore bookmark file: ${parsed.error.toString()}`,
    );
  }

  return parsed.data.map((bookmark) => {
    return {
      title: bookmark.title ?? "",
      content: { type: BookmarkTypes.LINK as const, url: bookmark.url },
      tags: bookmark.labels,
      addDate: bookmark.savedAt.getTime() / 1000,
    };
  });
}

export async function parseLinkwardenBookmarkFile(
  file: File,
): Promise<ParsedBookmark[]> {
  const textContent = await file.text();
  const zLinkwardenExportSchema = z.object({
    collections: z.array(
      z.object({
        links: z.array(
          z.object({
            name: z.string(),
            url: z.string(),
            tags: z.array(z.object({ name: z.string() })),
            createdAt: z.coerce.date(),
          }),
        ),
      }),
    ),
  });

  const parsed = zLinkwardenExportSchema.safeParse(JSON.parse(textContent));
  if (!parsed.success) {
    throw new Error(
      `The uploaded JSON file contains an invalid Linkwarden bookmark file: ${parsed.error.toString()}`,
    );
  }

  return parsed.data.collections.flatMap((collection) => {
    return collection.links.map((bookmark) => ({
      title: bookmark.name ?? "",
      content: { type: BookmarkTypes.LINK as const, url: bookmark.url },
      tags: bookmark.tags.map((tag) => tag.name),
      addDate: bookmark.createdAt.getTime() / 1000,
    }));
  });
}
