import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { sql } from "drizzle-orm";
import type { Adapter, AdapterUser } from "@auth/core/adapters";
import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import { users } from "@karakeep/db/schema";

export function CustomDrizzleAdapter(
  client: BaseSQLiteDatabase<"sync" | "async", any, any>,
  schema: {
    usersTable: typeof users;
    accountsTable: typeof accounts;
    sessionsTable: typeof sessions;
    verificationTokensTable: typeof verificationTokens;
  }
): Adapter {
  // Initialize the default Drizzle adapter
  const defaultAdapter = DrizzleAdapter(client, schema);

  // Override only getUserByEmail
  return {
    ...defaultAdapter,
    async getUserByEmail(email: string): Promise<AdapterUser | null> {
      if (!email) return null;
      const result = await client
        .select()
        .from(users)
        .where(sql`lower(${users.email}) = ${email.toLowerCase()}`)
        .get();
      return (result as AdapterUser) || null;
    },
  };
}
