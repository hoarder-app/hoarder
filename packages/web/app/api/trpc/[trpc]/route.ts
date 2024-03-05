import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@hoarder/trpc/routers/_app";
import { createContext } from "@/server/api/client";
import { authenticateApiKey } from "@hoarder/trpc/auth";
import { db } from "@hoarder/db";

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
      // TODO: This is a hack until we offer a proper REST API instead of the trpc based one.
      // Check if the request has an Authorization token, if it does, assume that API key authentication is requested.
      const authorizationHeader = opts.req.headers.get("Authorization");
      if (authorizationHeader && authorizationHeader.startsWith("Bearer ")) {
        const token = authorizationHeader.split(" ")[1];
        try {
          const user = await authenticateApiKey(token);
          return { user, db };
        } catch (e) {
          // Fallthrough to cookie-based auth
        }
      }

      return createContext();
    },
  });
export { handler as GET, handler as POST };
