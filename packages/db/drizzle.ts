import "dotenv/config";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "path";
import { Logger } from "drizzle-orm";

class MyLogger implements Logger {
  logQuery(query: string, _params: unknown[]): void {
    if (process.env.NODE_ENV === "production") {
      return;
    }
    const line = `Query: ${query}`;
    console.log(line);
  }
}

const sqlite = new Database(process.env.DATABASE_URL);
export const db = drizzle(sqlite, { schema, logger: new MyLogger() });

export function getInMemoryDB(runMigrations: boolean) {
  const mem = new Database(":memory:");
  const db = drizzle(mem, { schema, logger: true });
  if (runMigrations) {
    migrate(db, { migrationsFolder: path.resolve(__dirname, "./drizzle") });
  }
  return db;
}
