import { assert, beforeEach, describe, expect, test } from "vitest";

import { assets, AssetTypes, bookmarks } from "@karakeep/db/schema";
import { BookmarkTypes } from "@karakeep/shared/types/bookmarks";

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

  test<CustomTestContext>("email case insensitive uniqueness", async ({
    unauthedAPICaller,
  }) => {
    // Create user with lowercase email
    await unauthedAPICaller.users.create({
      name: "Test User",
      email: "test123@test.com",
      password: "pass1234",
      confirmPassword: "pass1234",
    });

    // Try to create another user with uppercase email - should fail
    await expect(() =>
      unauthedAPICaller.users.create({
        name: "Test User 2",
        email: "TEST123@TEST.COM",
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

  test<CustomTestContext>("get/update user settings", async ({
    db,
    unauthedAPICaller,
  }) => {
    const user = await unauthedAPICaller.users.create({
      name: "Test User",
      email: "testupdate@test.com",
      password: "pass1234",
      confirmPassword: "pass1234",
    });
    const caller = getApiCaller(db, user.id);

    const settings = await caller.users.settings();
    // The default settings
    expect(settings).toEqual({
      bookmarkClickAction: "open_original_link",
      archiveDisplayBehaviour: "show",
      timezone: "UTC",
    });

    // Update settings
    await caller.users.updateSettings({
      bookmarkClickAction: "expand_bookmark_preview",
    });

    // Verify updated settings
    const updatedSettings = await caller.users.settings();
    expect(updatedSettings).toEqual({
      bookmarkClickAction: "expand_bookmark_preview",
      archiveDisplayBehaviour: "show",
      timezone: "UTC",
    });

    // Test invalid update (e.g., empty input, if schema enforces it)
    await expect(() => caller.users.updateSettings({})).rejects.toThrow(
      /No settings provided/,
    );
  });

  test<CustomTestContext>("user stats - empty user", async ({
    db,
    unauthedAPICaller,
  }) => {
    const user = await unauthedAPICaller.users.create({
      name: "Test User",
      email: "stats@test.com",
      password: "pass1234",
      confirmPassword: "pass1234",
    });
    const caller = getApiCaller(db, user.id);

    const stats = await caller.users.stats();

    // All stats should be zero for a new user
    expect(stats.numBookmarks).toBe(0);
    expect(stats.numFavorites).toBe(0);
    expect(stats.numArchived).toBe(0);
    expect(stats.numTags).toBe(0);
    expect(stats.numLists).toBe(0);
    expect(stats.numHighlights).toBe(0);
    expect(stats.bookmarksByType).toEqual({ link: 0, text: 0, asset: 0 });
    expect(stats.topDomains).toEqual([]);
    expect(stats.totalAssetSize).toBe(0);
    expect(stats.assetsByType).toEqual([]);
    expect(stats.tagUsage).toEqual([]);
    expect(stats.bookmarkingActivity.thisWeek).toBe(0);
    expect(stats.bookmarkingActivity.thisMonth).toBe(0);
    expect(stats.bookmarkingActivity.thisYear).toBe(0);
    expect(stats.bookmarkingActivity.byHour).toHaveLength(24);
    expect(stats.bookmarkingActivity.byDayOfWeek).toHaveLength(7);

    // All hours and days should have 0 count
    stats.bookmarkingActivity.byHour.forEach((hour, index) => {
      expect(hour.hour).toBe(index);
      expect(hour.count).toBe(0);
    });
    stats.bookmarkingActivity.byDayOfWeek.forEach((day, index) => {
      expect(day.day).toBe(index);
      expect(day.count).toBe(0);
    });
  });

  test<CustomTestContext>("user stats - with data", async ({
    db,
    unauthedAPICaller,
  }) => {
    const user = await unauthedAPICaller.users.create({
      name: "Test User",
      email: "statsdata@test.com",
      password: "pass1234",
      confirmPassword: "pass1234",
    });
    const caller = getApiCaller(db, user.id);

    // Create test bookmarks
    const bookmark1 = await caller.bookmarks.createBookmark({
      url: "https://example.com/page1",
      type: BookmarkTypes.LINK,
    });

    const bookmark2 = await caller.bookmarks.createBookmark({
      url: "https://google.com/search",
      type: BookmarkTypes.LINK,
    });

    await caller.bookmarks.createBookmark({
      text: "Test note content",
      type: BookmarkTypes.TEXT,
    });

    // Create tags
    const tag1 = await caller.tags.create({ name: "tech" });
    const tag2 = await caller.tags.create({ name: "work" });

    // Create lists
    await caller.lists.create({
      name: "Test List",
      icon: "📚",
      type: "manual",
    });

    // Archive one bookmark
    await caller.bookmarks.updateBookmark({
      bookmarkId: bookmark1.id,
      archived: true,
    });

    // Favorite one bookmark
    await caller.bookmarks.updateBookmark({
      bookmarkId: bookmark2.id,
      favourited: true,
    });

    // Add tags to bookmarks
    await caller.bookmarks.updateTags({
      bookmarkId: bookmark1.id,
      attach: [{ tagId: tag1.id }],
      detach: [],
    });

    await caller.bookmarks.updateTags({
      bookmarkId: bookmark2.id,
      attach: [{ tagId: tag1.id }, { tagId: tag2.id }],
      detach: [],
    });

    // Create highlights
    await caller.highlights.create({
      bookmarkId: bookmark1.id,
      startOffset: 0,
      endOffset: 10,
      text: "highlighted text",
      note: "test note",
    });

    // Insert test assets directly into DB
    await db.insert(assets).values([
      {
        id: "asset1",
        assetType: AssetTypes.LINK_SCREENSHOT,
        size: 1024,
        contentType: "image/png",
        bookmarkId: bookmark1.id,
        userId: user.id,
      },
      {
        id: "asset2",
        assetType: AssetTypes.LINK_BANNER_IMAGE,
        size: 2048,
        contentType: "image/jpeg",
        bookmarkId: bookmark2.id,
        userId: user.id,
      },
    ]);

    const stats = await caller.users.stats();

    // Verify basic counts
    expect(stats.numBookmarks).toBe(3);
    expect(stats.numFavorites).toBe(1);
    expect(stats.numArchived).toBe(1);
    expect(stats.numTags).toBe(2);
    expect(stats.numLists).toBe(1);
    expect(stats.numHighlights).toBe(1);

    // Verify bookmark types
    expect(stats.bookmarksByType.link).toBe(2);
    expect(stats.bookmarksByType.text).toBe(1);
    expect(stats.bookmarksByType.asset).toBe(0);

    // Verify top domains
    expect(stats.topDomains).toHaveLength(2);
    expect(
      stats.topDomains.find((d) => d.domain === "example.com"),
    ).toBeTruthy();
    expect(
      stats.topDomains.find((d) => d.domain === "google.com"),
    ).toBeTruthy();

    // Verify asset stats
    expect(stats.totalAssetSize).toBe(3072); // 1024 + 2048
    expect(stats.assetsByType).toHaveLength(2);

    const screenshotAsset = stats.assetsByType.find(
      (a) => a.type === AssetTypes.LINK_SCREENSHOT,
    );
    expect(screenshotAsset?.count).toBe(1);
    expect(screenshotAsset?.totalSize).toBe(1024);

    const bannerAsset = stats.assetsByType.find(
      (a) => a.type === AssetTypes.LINK_BANNER_IMAGE,
    );
    expect(bannerAsset?.count).toBe(1);
    expect(bannerAsset?.totalSize).toBe(2048);

    // Verify tag usage
    expect(stats.tagUsage).toHaveLength(2);
    const techTag = stats.tagUsage.find((t) => t.name === "tech");
    const workTag = stats.tagUsage.find((t) => t.name === "work");
    expect(techTag?.count).toBe(2); // Used in 2 bookmarks
    expect(workTag?.count).toBe(1); // Used in 1 bookmark

    // Verify activity stats (should be > 0 since we just created bookmarks)
    expect(stats.bookmarkingActivity.thisWeek).toBe(3);
    expect(stats.bookmarkingActivity.thisMonth).toBe(3);
    expect(stats.bookmarkingActivity.thisYear).toBe(3);

    // Verify hour/day arrays are properly structured
    expect(stats.bookmarkingActivity.byHour).toHaveLength(24);
    expect(stats.bookmarkingActivity.byDayOfWeek).toHaveLength(7);
  });

  test<CustomTestContext>("user stats - privacy isolation", async ({
    db,
    unauthedAPICaller,
  }) => {
    // Create two users
    const user1 = await unauthedAPICaller.users.create({
      name: "User 1",
      email: "user1@test.com",
      password: "pass1234",
      confirmPassword: "pass1234",
    });

    const user2 = await unauthedAPICaller.users.create({
      name: "User 2",
      email: "user2@test.com",
      password: "pass1234",
      confirmPassword: "pass1234",
    });

    const caller1 = getApiCaller(db, user1.id);
    const caller2 = getApiCaller(db, user2.id);

    // User 1 creates some bookmarks
    const bookmark1 = await caller1.bookmarks.createBookmark({
      url: "https://user1.com",
      type: BookmarkTypes.LINK,
    });

    const tag1 = await caller1.tags.create({ name: "user1tag" });

    // Attach tag to bookmark
    await caller1.bookmarks.updateTags({
      bookmarkId: bookmark1.id,
      attach: [{ tagId: tag1.id }],
      detach: [],
    });

    // User 2 creates different bookmarks
    const bookmark2 = await caller2.bookmarks.createBookmark({
      url: "https://user2.com",
      type: BookmarkTypes.LINK,
    });

    const tag2 = await caller2.tags.create({ name: "user2tag" });

    // Attach tag to bookmark
    await caller2.bookmarks.updateTags({
      bookmarkId: bookmark2.id,
      attach: [{ tagId: tag2.id }],
      detach: [],
    });

    // Get stats for both users
    const stats1 = await caller1.users.stats();
    const stats2 = await caller2.users.stats();

    // Each user should only see their own data
    expect(stats1.numBookmarks).toBe(1);
    expect(stats1.numTags).toBe(1);
    expect(stats1.topDomains[0]?.domain).toBe("user1.com");
    expect(stats1.tagUsage[0]?.name).toBe("user1tag");

    expect(stats2.numBookmarks).toBe(1);
    expect(stats2.numTags).toBe(1);
    expect(stats2.topDomains[0]?.domain).toBe("user2.com");
    expect(stats2.tagUsage[0]?.name).toBe("user2tag");

    // Users should not see each other's data
    expect(stats1.topDomains.find((d) => d.domain === "user2.com")).toBeFalsy();
    expect(stats2.topDomains.find((d) => d.domain === "user1.com")).toBeFalsy();
  });

  test<CustomTestContext>("user stats - activity time patterns", async ({
    db,
    unauthedAPICaller,
  }) => {
    const user = await unauthedAPICaller.users.create({
      name: "Test User",
      email: "timepatterns@test.com",
      password: "pass1234",
      confirmPassword: "pass1234",
    });
    const caller = getApiCaller(db, user.id);

    // Create bookmarks with specific timestamps
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Insert bookmarks directly with specific timestamps
    await db
      .insert(bookmarks)
      .values([
        {
          userId: user.id,
          type: BookmarkTypes.LINK,
          createdAt: now,
          archived: false,
          favourited: false,
        },
        {
          userId: user.id,
          type: BookmarkTypes.LINK,
          createdAt: oneDayAgo,
          archived: false,
          favourited: false,
        },
        {
          userId: user.id,
          type: BookmarkTypes.LINK,
          createdAt: oneWeekAgo,
          archived: false,
          favourited: false,
        },
        {
          userId: user.id,
          type: BookmarkTypes.LINK,
          createdAt: oneMonthAgo,
          archived: false,
          favourited: false,
        },
      ])
      .returning();

    const stats = await caller.users.stats();

    // Verify activity counts based on time periods
    expect(stats.bookmarkingActivity.thisWeek).toBeGreaterThanOrEqual(2); // now + oneDayAgo
    expect(stats.bookmarkingActivity.thisMonth).toBeGreaterThanOrEqual(3); // now + oneDayAgo + oneWeekAgo
    expect(stats.bookmarkingActivity.thisYear).toBe(4); // All bookmarks

    // Verify that hour and day arrays have proper structure
    expect(
      stats.bookmarkingActivity.byHour.every(
        (h) => typeof h.hour === "number" && h.hour >= 0 && h.hour <= 23,
      ),
    ).toBe(true);

    expect(
      stats.bookmarkingActivity.byDayOfWeek.every(
        (d) => typeof d.day === "number" && d.day >= 0 && d.day <= 6,
      ),
    ).toBe(true);
  });
});
