import { eq } from "drizzle-orm";

import { db } from "@karakeep/db";
import { users } from "@karakeep/db/schema";
import { AuthedContext, createCallerFactory } from "@karakeep/trpc";
import { appRouter } from "@karakeep/trpc/routers/_app";

/**
 * This is only safe to use in the context of a worker.
 */
export async function buildImpersonatingAuthedContext(
  userId: string,
): Promise<AuthedContext> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  if (!user) {
    throw new Error("User not found");
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    db,
    req: {
      ip: null,
    },
  };
}

/**
 * This is only safe to use in the context of a worker.
 */
export async function buildImpersonatingTRPCClient(userId: string) {
  const createCaller = createCallerFactory(appRouter);

  return createCaller(await buildImpersonatingAuthedContext(userId));
}
