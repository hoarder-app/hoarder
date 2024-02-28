import { appRouter } from "./routers/_app";
import { getServerAuthSession } from "@/server/auth";
import { Context, createCallerFactory } from "./trpc";
import { db } from "@hoarder/db";

export const createContext = async (database?: typeof db): Promise<Context> => {
  const session = await getServerAuthSession();
  return {
    user: session?.user ?? null,
    db: database ?? db,
  };
};

const createCaller = createCallerFactory(appRouter);

export const api = createCaller(createContext);
