import { NextRequest, NextResponse } from "next/server";
import fetch from "node-fetch";

import serverConfig from "../../../../../packages/shared/config";

const checkMeilisearchHealth = async () => {
  if (!serverConfig.meilisearch) {
    return { status: "unavailable", message: "Meilisearch is not configured" };
  }

  try {
    const response = await fetch(`${serverConfig.meilisearch.address}/health`, {
      headers: {
        Authorization: `Bearer ${serverConfig.meilisearch.key}`,
      },
    });

    if (response.ok) {
      return { status: "ok", message: "Meilisearch is working" };
    } else {
      return {
        status: "error",
        message: "Meilisearch is not responding correctly",
      };
    }
  } catch (error) {
    let errorMessage = "An unknown error occurred";
    if (error instanceof Error) {
      errorMessage = `Meilisearch check failed: ${error.message}`;
    }
    return { status: "error", message: errorMessage };
  }
};

export const GET = async (_req: NextRequest) => {
  const webAppStatus = { status: "ok", message: "Web app is working" };
  const meilisearchStatus = await checkMeilisearchHealth();

  return NextResponse.json({
    webApp: webAppStatus,
    meilisearch: meilisearchStatus,
  });
};
