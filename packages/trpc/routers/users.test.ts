import { assert, beforeEach, describe, expect, test } from "vitest";

import type { CustomTestContext } from "../testUtils";
import { defaultBeforeEach, getApiCaller } from "../testUtils";

beforeEach<CustomTestContext>(defaultBeforeEach(false));

describe("User Routes", () => {
  test<CustomTestContext>("create user", async ({ unauthedAPICaller }) => {
    const user = await unauthedAPICaller.users.create({
      name: "Test User",
      email: "test123@test.com",
      password: "pass1234",
      confirmPassword: "pass1234",
    });

    expect(user.name).toEqual("Test User");
    expect(user.email).toEqual("test123@test.com");
  });

  test<CustomTestContext>("first user is admin", async ({
    unauthedAPICaller,
  }) => {
    const user1 = await unauthedAPICaller.users.create({
      name: "Test User",
      email: "test123@test.com",
      password: "pass1234",
      confirmPassword: "pass1234",
    });

    const user2 = await unauthedAPICaller.users.create({
      name: "Test User",
      email: "test124@test.com",
      password: "pass1234",
      confirmPassword: "pass1234",
    });

    expect(user1.role).toEqual("admin");
    expect(user2.role).toEqual("user");
  });

  test<CustomTestContext>("unique emails", async ({ unauthedAPICaller }) => {
    await unauthedAPICaller.users.create({
      name: "Test User",
      email: "test123@test.com",
      password: "pass1234",
      confirmPassword: "pass1234",
    });

    await expect(() =>
      unauthedAPICaller.users.create({
        name: "Test User",
        email: "test123@test.com",
        password: "pass1234",
        confirmPassword: "pass1234",
      }),
    ).rejects.toThrow(/Email is already taken/);
  });

  test<CustomTestContext>("privacy checks", async ({
    db,
    unauthedAPICaller,
  }) => {
    const adminUser = await unauthedAPICaller.users.create({
      name: "Test User",
      email: "test123@test.com",
      password: "pass1234",
      confirmPassword: "pass1234",
    });
    const [user1, user2] = await Promise.all(
      ["test1234@test.com", "test12345@test.com"].map((e) =>
        unauthedAPICaller.users.create({
          name: "Test User",
          email: e,
          password: "pass1234",
          confirmPassword: "pass1234",
        }),
      ),
    );

    assert(adminUser.role == "admin");
    assert(user1.role == "user");
    assert(user2.role == "user");

    const user2Caller = getApiCaller(db, user2.id);

    // A normal user can't delete other users
    await expect(() =>
      user2Caller.users.delete({
        userId: user1.id,
      }),
    ).rejects.toThrow(/FORBIDDEN/);

    // A normal user can't list all users
    await expect(() => user2Caller.users.list()).rejects.toThrow(/FORBIDDEN/);
  });
});
