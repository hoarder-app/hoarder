import "dotenv/config";
import type { Config } from "drizzle-kit";

const databaseURL = process.env.DATA_DIR
  ? `${process.env.DATA_DIR}/db.db`
  : "./db.db";

export default {
  schema: "./schema.ts",
  out: "./drizzle",
  driver: "better-sqlite",
  dbCredentials: {
    url: databaseURL,
  },
} satisfies Config;
