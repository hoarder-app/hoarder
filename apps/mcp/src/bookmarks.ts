import { CallToolResult } from "@modelcontextprotocol/sdk/types";
import { z } from "zod";

import { karakeepClient, mcpServer, turndownService } from "./shared";
import { compactBookmark, toMcpToolError } from "./utils";

// Tools
mcpServer.tool(
  "search-bookmarks",
  `Search for bookmarks matching a specific a query.
`,
  {
    query: z.string().describe(`
    By default, this will do a full-text search, but you can also use qualifiers to filter the results.
You can search bookmarks using specific qualifiers. is:fav finds favorited bookmarks,
is:archived searches archived bookmarks, is:tagged finds those with tags,
is:inlist finds those in lists, and is:link, is:text, and is:media filter by bookmark type.
url:<value> searches for URL substrings, #<tag> searches for bookmarks with a specific tag,
list:<name> searches for bookmarks in a specific list,
after:<date> finds bookmarks created on or after a date (YYYY-MM-DD), and before:<date> finds bookmarks created on or before a date (YYYY-MM-DD).
If you need to pass names with spaces, you can quote them with double quotes. If you want to negate a qualifier, prefix it with a minus sign.
## Examples:

### Find favorited bookmarks from 2023 that are tagged "important"
is:fav after:2023-01-01 before:2023-12-31 #important

### Find archived bookmarks that are either in "reading" list or tagged "work"
is:archived and (list:reading or #work)

### Combine text search with qualifiers
machine learning is:fav`),
  },
  async ({ query }): Promise<CallToolResult> => {
    const res = await karakeepClient.GET("/bookmarks/search", {
      params: {
        query: {
          q: query,
          limit: 10,
        },
      },
    });
    if (!res.data) {
      return toMcpToolError(res.error);
    }
    return {
      content: res.data.bookmarks.map((bookmark) => ({
        type: "text",
        text: JSON.stringify(compactBookmark(bookmark)),
      })),
    };
  },
);

mcpServer.tool(
  "get-bookmark",
  `Get a bookmark by id.`,
  {
    bookmarkId: z.string().describe(`The bookmarkId to get.`),
  },
  async ({ bookmarkId }): Promise<CallToolResult> => {
    const res = await karakeepClient.GET(`/bookmarks/{bookmarkId}`, {
      params: {
        path: {
          bookmarkId,
        },
      },
    });
    if (res.error) {
      return toMcpToolError(res.error);
    }
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(compactBookmark(res.data)),
        },
      ],
    };
  },
);

mcpServer.tool(
  "create-text-bookmark",
  `Create a text bookmark`,
  {
    title: z.string().optional().describe(`The title of the bookmark`),
    text: z.string().describe(`The text to be bookmarked`),
  },
  async ({ title, text }): Promise<CallToolResult> => {
    const res = await karakeepClient.POST(`/bookmarks`, {
      body: {
        type: "text",
        title,
        text,
      },
    });
    if (res.error) {
      return toMcpToolError(res.error);
    }
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(compactBookmark(res.data)),
        },
      ],
    };
  },
);

mcpServer.tool(
  "create-url-bookmark",
  `Create a url bookmark`,
  {
    title: z.string().optional().describe(`The title of the bookmark`),
    url: z.string().describe(`The url to be bookmarked`),
  },
  async ({ title, url }): Promise<CallToolResult> => {
    const res = await karakeepClient.POST(`/bookmarks`, {
      body: {
        type: "link",
        title,
        url,
      },
    });
    if (res.error) {
      return toMcpToolError(res.error);
    }
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(compactBookmark(res.data)),
        },
      ],
    };
  },
);

mcpServer.tool(
  "get-bookmark-content",
  `Get a bookmark content.`,
  {
    bookmarkId: z.string().describe(`The bookmarkId to get content for.`),
  },
  async ({ bookmarkId }): Promise<CallToolResult> => {
    const res = await karakeepClient.GET(`/bookmarks/{bookmarkId}`, {
      params: {
        path: {
          bookmarkId,
        },
      },
    });
    if (res.error) {
      return toMcpToolError(res.error);
    }
    let content;
    if (res.data.content.type === "link") {
      const htmlContent = res.data.content.htmlContent;
      content = turndownService.turndown(htmlContent);
    } else if (res.data.content.type === "text") {
      content = res.data.content.text;
    } else if (res.data.content.type === "asset") {
      content = "";
    }
    return {
      content: [
        {
          type: "text",
          text: content ?? "",
        },
      ],
    };
  },
);
