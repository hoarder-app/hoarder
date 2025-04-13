import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types";

import { createHoarderClient } from "@karakeep/sdk";

const addr = process.env.KARAKEEP_API_ADDR;
const apiKey = process.env.KARAKEEP_API_KEY;

export const karakeepClient = createHoarderClient({
  baseUrl: `${addr}/api/v1`,
  headers: {
    "Content-Type": "application/json",
    authorization: `Bearer ${apiKey}`,
  },
});

export const mcpServer = new McpServer({
  name: "Karakeep",
  version: "0.23.0",
});

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
