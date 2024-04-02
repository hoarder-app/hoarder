import * as fs from "node:fs";
import { Command } from "@commander-js/extra-typings";
import chalk from "chalk";
import { getAPIClient } from "lib/trpc";

import type { ZBookmark } from "@hoarder/trpc/types/bookmarks";

export const bookmarkCmd = new Command()
  .name("bookmarks")
  .description("Manipulating bookmarks");

function collect<T>(val: T, acc: T[]) {
  acc.push(val);
  return acc;
}

function normalizeBookmark(bookmark: ZBookmark) {
  const ret = {
    ...bookmark,
    tags: bookmark.tags.map((t) => t.name),
  };

  if (ret.content.type == "link" && ret.content.htmlContent) {
    if (ret.content.htmlContent.length > 10) {
      ret.content.htmlContent =
        ret.content.htmlContent.substring(0, 10) + "... <CROPPED>";
    }
  }
  return ret;
}

bookmarkCmd
  .command("add")
  .description("Creates a new bookmark")
  .option(
    "--link <link>",
    "the link to add. Specify multiple times to add multiple links",
    collect<string>,
    [],
  )
  .option(
    "--note <note>",
    "the note text to add. Specify multiple times to add multiple notes",
    collect<string>,
    [],
  )
  .option("--stdin", "reads the data from stdin and store it as a note")
  .action(async (opts) => {
    const api = getAPIClient();

    const promises = [
      ...opts.link.map((url) =>
        api.bookmarks.createBookmark.mutate({ type: "link", url }),
      ),
      ...opts.note.map((text) =>
        api.bookmarks.createBookmark.mutate({ type: "text", text }),
      ),
    ];

    if (opts.stdin) {
      const text = fs.readFileSync(0, "utf-8");
      promises.push(
        api.bookmarks.createBookmark.mutate({ type: "text", text }),
      );
    }

    const results = await Promise.allSettled(promises);

    for (const res of results) {
      if (res.status == "fulfilled") {
        console.log(normalizeBookmark(res.value));
      } else {
        console.log(chalk.red(`Error: ${res.reason}`));
      }
    }
  });

bookmarkCmd
  .command("get")
  .description("fetch information about a bookmark")
  .argument("<id>", "The id of the bookmark to get")
  .action(async (id) => {
    const api = getAPIClient();
    const resp = await api.bookmarks.getBookmark.query({ bookmarkId: id });
    console.log(normalizeBookmark(resp));
  });

bookmarkCmd
  .command("list")
  .description("list all bookmarks")
  .option(
    "--include-archived",
    "If set, archived bookmarks will be fetched as well",
    false,
  )
  .action(async (opts) => {
    const api = getAPIClient();
    const resp = await api.bookmarks.getBookmarks.query({
      archived: opts.includeArchived ? undefined : false,
    });
    console.log(resp.bookmarks.map(normalizeBookmark));
  });

bookmarkCmd
  .command("delete")
  .description("delete a bookmark")
  .argument("<id>", "The id of the bookmark to delete")
  .action(async (id) => {
    const api = getAPIClient();
    await api.bookmarks.deleteBookmark.mutate({ bookmarkId: id });
    console.log(`Bookmark ${id} got deleted`);
  });
