import { Hono } from "hono";
import { logger } from "hono/logger";
import { poweredBy } from "hono/powered-by";

import bookmarks from "./routes/bookmarks";
import highlights from "./routes/highlights";
import lists from "./routes/lists";
import tags from "./routes/tags";
import users from "./routes/users";

const v2 = new Hono()
  .route("/highlights", highlights)
  .route("/bookmarks", bookmarks)
  .route("/lists", lists)
  .route("/tags", tags)
  .route("/users", users);

const app = new Hono().use(logger()).use(poweredBy()).route("/v2", v2);

export default app;
