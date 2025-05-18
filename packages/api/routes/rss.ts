import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import serverConfig from "@karakeep/shared/config";
import { List } from "@karakeep/trpc/models/lists";

import { unauthedMiddleware } from "../middlewares/auth";
import { zPagination } from "../utils/pagination";
import { toRSS } from "../utils/rss";
import { zGetBookmarkQueryParamsSchema } from "../utils/types";

const app = new Hono().get(
  "/lists/:listId",
  zValidator(
    "query",
    z
      .object({
        token: z.string().min(1),
      })
      .and(zGetBookmarkQueryParamsSchema)
      .and(zPagination),
  ),
  unauthedMiddleware,
  async (c) => {
    const listId = c.req.param("listId");
    const searchParams = c.req.valid("query");
    const token = searchParams.token;

    const res = await List.getForRss(c.var.ctx, listId, token);
    const list = res.list;

    const rssFeed = toRSS(
      {
        title: `Bookmarks from ${list.icon} ${list.name}`,
        feedUrl: `${serverConfig.publicApiUrl}/v1/rss/lists/${listId}`,
        siteUrl: `${serverConfig.publicUrl}/dashboard/lists/${listId}`,
        description: list.description ?? undefined,
      },
      res.bookmarks,
    );

    c.header("Content-Type", "application/rss+xml");
    return c.body(rssFeed);
  },
);

export default app;
