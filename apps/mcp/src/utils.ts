import { CallToolResult } from "@modelcontextprotocol/sdk/types";

import { KarakeepAPISchemas } from "@karakeep/sdk";

export function toMcpToolError(
  error: { code: string; message: string } | undefined,
): CallToolResult {
  return {
    isError: true,
    content: [
      {
        type: "text",
        text: error ? JSON.stringify(error) : `Something went wrong`,
      },
    ],
  };
}

interface CompactBookmark {
  id: string;
  createdAt: string;
  title: string;
  summary: string;
  note: string;
  content:
    | {
        type: "link";
        url: string;
        description: string;
        author: string;
        publisher: string;
      }
    | {
        type: "text";
        sourceUrl: string;
      }
    | {
        type: "media";
        assetId: string;
        assetType: string;
        sourceUrl: string;
      }
    | {
        type: "unknown";
      };
  tags: string[];
}

export function compactBookmark(
  bookmark: KarakeepAPISchemas["Bookmark"],
): CompactBookmark {
  let content: CompactBookmark["content"];
  if (bookmark.content.type === "link") {
    content = {
      type: "link",
      url: bookmark.content.url,
      description: bookmark.content.description ?? "",
      author: bookmark.content.author ?? "",
      publisher: bookmark.content.publisher ?? "",
    };
  } else if (bookmark.content.type === "text") {
    content = {
      type: "text",
      sourceUrl: bookmark.content.sourceUrl ?? "",
    };
  } else if (bookmark.content.type === "asset") {
    content = {
      type: "media",
      assetId: bookmark.content.assetId,
      assetType: bookmark.content.assetType,
      sourceUrl: bookmark.content.sourceUrl ?? "",
    };
  } else {
    content = {
      type: "unknown",
    };
  }

  return {
    id: bookmark.id,
    createdAt: bookmark.createdAt,
    title: bookmark.title
      ? bookmark.title
      : ((bookmark.content.type === "link"
          ? bookmark.content.title
          : undefined) ?? ""),
    summary: bookmark.summary ?? "",
    note: bookmark.note ?? "",
    content,
    tags: bookmark.tags.map((t) => t.name),
  };
}
