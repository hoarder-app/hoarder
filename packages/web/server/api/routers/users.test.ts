import { CustomTestContext, defaultBeforeEach } from "@/lib/testUtils";
import { expect, describe, test, beforeEach } from "vitest";

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
});
