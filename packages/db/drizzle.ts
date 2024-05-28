import "dotenv/config";

import path from "path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import dbConfig from "./drizzle.config";
import * as schema from "./schema";

const sqlite = new Database(dbConfig.dbCredentials.url);
// export const db = drizzle(sqlite, { schema, logger: true });
export const db = drizzle(sqlite, { schema });

export function getInMemoryDB(runMigrations: boolean) {
  const mem = new Database(":memory:");
  const db = drizzle(mem, { schema, logger: true });
  if (runMigrations) {
    migrate(db, { migrationsFolder: path.resolve(__dirname, "./drizzle") });
  }
  return db;
}
