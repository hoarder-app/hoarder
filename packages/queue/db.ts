import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import * as schema from "./schema";

export function buildDBClient(path: string, runMigrations = true) {
  const sqlite = new Database(path);
  const db = drizzle(sqlite, { schema });
  if (runMigrations) {
    migrate(db, { migrationsFolder: "./drizzle" });
  }
  return db;
}
