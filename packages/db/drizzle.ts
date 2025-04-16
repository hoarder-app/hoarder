import "dotenv/config";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "path";

import dbConfig from "./drizzle.config";

const sqlite = new Database(dbConfig.dbCredentials.url);
export const db = drizzle(sqlite, { schema });
export type DB = typeof db;

export function getInMemoryDB(runMigrations: boolean) {
  const mem = new Database(":memory:");
  const db = drizzle(mem, { schema, logger: false });
  if (runMigrations) {
    migrate(db, { migrationsFolder: path.resolve(__dirname, "./drizzle") });
  }
  return db;
}
