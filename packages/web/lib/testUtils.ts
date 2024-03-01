import { users } from "@hoarder/db/schema";
import { getInMemoryDB } from "@hoarder/db/drizzle";
import { appRouter } from "@/server/api/routers/_app";
import { createCallerFactory } from "@/server/api/trpc";

export function getTestDB() {
  return getInMemoryDB(true);
}

export type TestDB = ReturnType<typeof getTestDB>;

export async function seedUsers(db: TestDB) {
  return await db
    .insert(users)
    .values([
      {
        name: "Test User 1",
        email: "test1@test.com",
      },
      {
        name: "Test User 2",
        email: "test2@test.com",
      },
    ])
    .returning();
}

export function getApiCaller(db: TestDB, userId: string) {
  const createCaller = createCallerFactory(appRouter);
  return createCaller({
    user: {
      id: userId,
      role: "user",
    },
    db,
  });
}

export type APICallerType = ReturnType<typeof getApiCaller>;

export interface CustomTestContext {
  apiCallers: APICallerType[];
  db: TestDB;
}

export async function buildTestContext(): Promise<CustomTestContext> {
  const db = getTestDB();
  const users = await seedUsers(db);
  const callers = users.map((u) => getApiCaller(db, u.id));

  return {
    apiCallers: callers,
    db,
  };
}

export const defaultBeforeEach = async (context: object) => {
  Object.assign(context, await buildTestContext());
};
