// Copied from https://gist.github.com/devster31/4e8c6548fd16ffb75c02e6f24e27f9b9
import * as cheerio from "cheerio";

export interface ParsedBookmark {
  title: string;
  url?: string;
  tags: string[];
  addDate?: number;
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
      return {
        title: $a.text(),
        url: $a.attr("href"),
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

  const $ = cheerio.load(textContent);

  return $("a")
    .map(function (_index, a) {
      const $a = $(a);
      const addDate = $a.attr("time_added");
      let tags: string[] = [];
      const tagsStr = $a.attr("tags");
      try {
        tags = tagsStr && tagsStr.length > 0 ? tagsStr.split(",") : [];
      } catch (e) {
        /* empty */
      }
      return {
        title: $a.text(),
        url: $a.attr("href"),
        tags,
        addDate: typeof addDate === "undefined" ? undefined : parseInt(addDate),
      };
    })
    .get();
}
