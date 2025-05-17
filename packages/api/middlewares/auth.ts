import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import requestIp from "request-ip";

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
  const ip = requestIp.getClientIp({
    headers: Object.fromEntries(c.req.raw.headers),
  });
  const authorizationHeader = c.req.header("Authorization");

  if (!authorizationHeader) {
    throw new HTTPException(401, {
      message: "Unauthorized",
    });
  }
  const token = authorizationHeader.split(" ")[1];
  try {
    const user = await authenticateApiKey(token);
    c.set("ctx", {
      user,
      db,
      req: {
        ip,
      },
    });
  } catch (e) {
    throw new HTTPException(401, {
      message: "Unauthorized",
    });
  }
  c.set("api", createCaller(c.get("ctx")));
  await next();
});
