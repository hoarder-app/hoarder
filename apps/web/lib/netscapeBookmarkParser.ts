// Copied from https://gist.github.com/devster31/4e8c6548fd16ffb75c02e6f24e27f9b9
import * as cheerio from "cheerio";

export async function parseNetscapeBookmarkFile(file: File) {
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
      try {
        tags = $a.attr("tags")?.split(",") ?? [];
      } catch (e) {
        /* empty */
      }
      return {
        title: $a.text(),
        url: $a.attr("href"),
        tags: tags,
        addDate: typeof addDate === "undefined" ? undefined : parseInt(addDate),
      };
    })
    .get();
}
