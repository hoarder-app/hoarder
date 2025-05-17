import { Hono } from "hono";
import { logger } from "hono/logger";
import { poweredBy } from "hono/powered-by";

import highlights from "./routes/highlights";

const v2 = new Hono().route("/highlights", highlights);

const app = new Hono().use(logger()).use(poweredBy()).route("/v2", v2);

export default app;
