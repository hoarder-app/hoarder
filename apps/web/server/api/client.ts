import { getServerAuthSession } from "@/server/auth";

import { db } from "@hoarder/db";
import { Context, createCallerFactory } from "@hoarder/trpc";
import { authenticateApiKey } from "@hoarder/trpc/auth";
import { appRouter } from "@hoarder/trpc/routers/_app";

export async function createContextFromRequest(req: Request) {
  // TODO: This is a hack until we offer a proper REST API instead of the trpc based one.
  // Check if the request has an Authorization token, if it does, assume that API key authentication is requested.
  const authorizationHeader = req.headers.get("Authorization");
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
}

export const createContext = async (database?: typeof db): Promise<Context> => {
  const session = await getServerAuthSession();
  return {
    user: session?.user ?? null,
    db: database ?? db,
  };
};

const createCaller = createCallerFactory(appRouter);

export const api = createCaller(createContext);
