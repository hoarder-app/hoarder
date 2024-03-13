import { getServerAuthSession } from "@/server/auth";

import { db } from "@hoarder/db";
import { Context, createCallerFactory } from "@hoarder/trpc";
import { appRouter } from "@hoarder/trpc/routers/_app";

export const createContext = async (database?: typeof db): Promise<Context> => {
  const session = await getServerAuthSession();
  return {
    user: session?.user ?? null,
    db: database ?? db,
  };
};

const createCaller = createCallerFactory(appRouter);

export const api = createCaller(createContext);
