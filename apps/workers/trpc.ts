import { eq } from "drizzle-orm";

import { db } from "@hoarder/db";
import { users } from "@hoarder/db/schema";
import { createCallerFactory } from "@hoarder/trpc";
import { appRouter } from "@hoarder/trpc/routers/_app";

/**
 * This is only safe to use in the context of a worker.
 */
export async function buildImpersonatingTRPCClient(userId: string) {
  const createCaller = createCallerFactory(appRouter);

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  if (!user) {
    throw new Error("User not found");
  }

  return createCaller({
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
  });
}
