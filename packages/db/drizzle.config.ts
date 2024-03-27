import "dotenv/config";
import type { Config } from "drizzle-kit";
import serverConfig from "@hoarder/shared/config";

const databaseURL = serverConfig.dataDir
  ? `${serverConfig.dataDir}/db.db`
  : "./db.db";

export default {
  schema: "./schema.ts",
  out: "./drizzle",
  driver: "better-sqlite",
  dbCredentials: {
    url: databaseURL,
  },
} satisfies Config;
