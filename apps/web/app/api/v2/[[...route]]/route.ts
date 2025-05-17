import { Hono } from "hono";
import { handle } from "hono/vercel";

import allApp from "@karakeep/api";

export const runtime = "nodejs";

const app = new Hono().basePath("/api/v2").route("/", allApp);

export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
export const OPTIONS = handle(app);
export const PUT = handle(app);
