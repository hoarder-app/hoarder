import { Hono } from "hono";
import { logger } from "hono/logger";
import { poweredBy } from "hono/powered-by";

import { Context } from "@karakeep/trpc";

import trpcAdapter from "./middlewares/trpcAdapter";
import assets from "./routes/assets";
import bookmarks from "./routes/bookmarks";
import health from "./routes/health";
import highlights from "./routes/highlights";
import lists from "./routes/lists";
import publicRoute from "./routes/public";
import rss from "./routes/rss";
import tags from "./routes/tags";
import trpc from "./routes/trpc";
import users from "./routes/users";

const v1 = new Hono<{
  Variables: {
    ctx: Context;
  };
}>()
  .route("/highlights", highlights)
  .route("/bookmarks", bookmarks)
  .route("/lists", lists)
  .route("/tags", tags)
  .route("/users", users)
  .route("/assets", assets)
  .route("/rss", rss);

const app = new Hono<{
  Variables: {
    // This is going to be coming from the web app
    ctx: Context;
  };
}>()
  .use(logger())
  .use(poweredBy())
  .use(async (c, next) => {
    // Ensure that the ctx is set
    if (!c.var.ctx) {
      throw new Error("Context is not set");
    }
    await next();
  })
  .use(trpcAdapter)
  .route("/health", health)
  .route("/trpc", trpc)
  .route("/v1", v1)
  .route("/assets", assets)
  .route("/public", publicRoute);

export default app;
