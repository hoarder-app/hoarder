import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";

import { AuthedContext, createCallerFactory } from "@karakeep/trpc";
import { appRouter } from "@karakeep/trpc/routers/_app";

const createCaller = createCallerFactory(appRouter);

export const authMiddleware = createMiddleware<{
  Variables: {
    ctx: AuthedContext;
    api: ReturnType<typeof createCaller>;
  };
}>(async (c, next) => {
  if (!c.var.ctx || !c.var.ctx.user || c.var.ctx.user === null) {
    throw new HTTPException(401, {
      message: "Unauthorized",
    });
  }
  c.set("api", createCaller(c.get("ctx")));
  await next();
});
