import "dotenv/config";
import type { Config } from "drizzle-kit";

if (!process.env.DATA_DIR) {
  throw new Error("DATA_DIR environment variable is required");
}

const databaseURL = `${process.env.DATA_DIR}/db.db`;

export default {
  schema: "./schema.ts",
  out: "./drizzle",
  driver: "better-sqlite",
  dbCredentials: {
    url: databaseURL,
  },
} satisfies Config;
