import { getConnInfo } from "@hono/node-server/conninfo";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";

import { db } from "@karakeep/db";
import { AuthedContext, createCallerFactory } from "@karakeep/trpc";
import { authenticateApiKey } from "@karakeep/trpc/auth";
import { appRouter } from "@karakeep/trpc/routers/_app";

const createCaller = createCallerFactory(appRouter);

export const authMiddleware = createMiddleware<{
  Variables: {
    ctx: AuthedContext;
    api: ReturnType<typeof createCaller>;
  };
}>(async (c, next) => {
  const connInfo = getConnInfo(c);
  const authorizationHeader = c.req.header("Authorization");

  if (!authorizationHeader) {
    throw new HTTPException(401, {
      message: "Unauthorized",
    });
  }
  const token = authorizationHeader.split(" ")[1];
  const user = await authenticateApiKey(token);
  c.set("ctx", {
    user,
    db,
    req: {
      ip: connInfo.remote.address ?? null,
    },
  });
  c.set("api", createCaller(c.get("ctx")));
  await next();
});
