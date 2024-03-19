import { createContextFromRequest } from "@/server/api/client";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { appRouter } from "@hoarder/trpc/routers/_app";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    onError: ({ path, error }) => {
      if (process.env.NODE_ENV === "development") {
        console.error(`❌ tRPC failed on ${path}`);
      }
      console.error(error);
    },

    createContext: async (opts) => {
      return await createContextFromRequest(opts.req);
    },
  });
export { handler as GET, handler as POST };
