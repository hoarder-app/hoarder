"use client";
import { httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/server/api/routers/_app";

import { loggerLink } from "@trpc/client";
import { createTRPCClient } from "@trpc/client";

export const api = createTRPCClient<AppRouter>({
  links: [
    loggerLink({
      enabled: (op) =>
        process.env.NODE_ENV === "development" ||
        (op.direction === "down" && op.result instanceof Error),
    }),
    httpBatchLink({
      // TODO: Change this to be a full URL exposed as a client side setting
      url: `/api/trpc`,
    }),
  ],
});
