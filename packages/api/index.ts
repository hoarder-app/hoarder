import { Hono } from "hono";
import { logger } from "hono/logger";
import { poweredBy } from "hono/powered-by";

import trpcAdapter from "./middlewares/trpcAdapter";
import assets from "./routes/assets";
import bookmarks from "./routes/bookmarks";
import highlights from "./routes/highlights";
import lists from "./routes/lists";
import tags from "./routes/tags";
import users from "./routes/users";

const app = new Hono()
  .use(logger())
  .use(poweredBy())
  .use(trpcAdapter)
  .route("/highlights", highlights)
  .route("/bookmarks", bookmarks)
  .route("/lists", lists)
  .route("/tags", tags)
  .route("/users", users)
  .route("/assets", assets);

export default app;
