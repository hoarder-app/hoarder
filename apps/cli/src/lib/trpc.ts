import { getGlobalOptions } from "@/lib/globals";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";

import type { AppRouter } from "@hoarder/trpc/routers/_app";

export function getAPIClient() {
  const globals = getGlobalOptions();
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${globals.serverAddr}/api/trpc`,
        maxURLLength: 14000,
        transformer: superjson,
        headers() {
          return {
            authorization: `Bearer ${globals.apiKey}`,
          };
        },
      }),
    ],
  });
}
