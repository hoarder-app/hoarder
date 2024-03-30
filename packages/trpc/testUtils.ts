import { getInMemoryDB } from "@hoarder/db/drizzle";
import { users } from "@hoarder/db/schema";

import { createCallerFactory } from "./index";
import { appRouter } from "./routers/_app";

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

export function getApiCaller(db: TestDB, userId?: string) {
  const createCaller = createCallerFactory(appRouter);
  return createCaller({
    user: userId
      ? {
          id: userId,
          role: "user",
        }
      : null,
    db,
  });
}

export type APICallerType = ReturnType<typeof getApiCaller>;

export interface CustomTestContext {
  apiCallers: APICallerType[];
  unauthedAPICaller: APICallerType;
  db: TestDB;
}

export async function buildTestContext(
  seedDB: boolean,
): Promise<CustomTestContext> {
  const db = getTestDB();
  let users: Awaited<ReturnType<typeof seedUsers>> = [];
  if (seedDB) {
    users = await seedUsers(db);
  }
  const callers = users.map((u) => getApiCaller(db, u.id));

  return {
    apiCallers: callers,
    unauthedAPICaller: getApiCaller(db),
    db,
  };
}

export function defaultBeforeEach(seedDB = true) {
  return async (context: object) => {
    Object.assign(context, await buildTestContext(seedDB));
  };
}
