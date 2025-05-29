import { beforeEach, describe, expect, test } from "vitest";

import type { CustomTestContext } from "../testUtils";
import { defaultBeforeEach } from "../testUtils";

beforeEach<CustomTestContext>(defaultBeforeEach(true));

describe("Tags Pagination", () => {
  test<CustomTestContext>("should return paginated tags with default limit", async ({
    apiCallers,
  }) => {
    const api = apiCallers[0].tags;

    // Create 60 tags
    const tagPromises = [];
    for (let i = 0; i < 60; i++) {
      tagPromises.push(
        api.create({ name: `tag-${i.toString().padStart(3, "0")}` }),
      );
    }
    await Promise.all(tagPromises);

    // Get first page with default limit
    const result = await api.list();

    expect(result.tags).toHaveLength(50); // Default limit
    expect(result.total).toBe(60);
    expect(result.hasMore).toBe(true);
  });

  test<CustomTestContext>("should return paginated tags with custom limit", async ({
    apiCallers,
  }) => {
    const api = apiCallers[0].tags;

    // Create 30 tags
    const tagPromises = [];
    for (let i = 0; i < 30; i++) {
      tagPromises.push(api.create({ name: `tag-${i}` }));
    }
    await Promise.all(tagPromises);

    // Get first page with custom limit
    const result = await api.list({ limit: 10 });

    expect(result.tags).toHaveLength(10);
    expect(result.total).toBe(30);
    expect(result.hasMore).toBe(true);
  });

  test<CustomTestContext>("should return correct data with offset", async ({
    apiCallers,
  }) => {
    const api = apiCallers[0].tags;

    // Create 25 tags with predictable names
    const createdTags = [];
    for (let i = 0; i < 25; i++) {
      const tag = await api.create({
        name: `tag-${i.toString().padStart(2, "0")}`,
      });
      createdTags.push(tag);
    }

    // Get second page
    const result = await api.list({ limit: 10, offset: 10 });

    expect(result.tags).toHaveLength(10);
    expect(result.total).toBe(25);
    expect(result.hasMore).toBe(true);

    // Verify we got some tags from the middle range
    const tagNames = result.tags.map((t) => t.name);
    const hasExpectedTags = tagNames.some((name) => {
      const num = parseInt(name.replace("tag-", ""));
      return num >= 10 && num < 20;
    });
    expect(hasExpectedTags).toBe(true);
  });

  test<CustomTestContext>("should handle last page correctly", async ({
    apiCallers,
  }) => {
    const api = apiCallers[0].tags;

    // Create 55 tags
    const tagPromises = [];
    for (let i = 0; i < 55; i++) {
      tagPromises.push(api.create({ name: `tag-${i}` }));
    }
    await Promise.all(tagPromises);

    // Get last page
    const result = await api.list({ limit: 50, offset: 50 });

    expect(result.tags).toHaveLength(5); // Only 5 remaining
    expect(result.total).toBe(55);
    expect(result.hasMore).toBe(false);
  });

  test<CustomTestContext>("should handle empty result set", async ({
    apiCallers,
  }) => {
    const api = apiCallers[0].tags;

    // Don't create any tags
    const result = await api.list();

    expect(result.tags).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.hasMore).toBe(false);
  });

  test<CustomTestContext>("should respect maximum limit constraint", async ({
    apiCallers,
  }) => {
    const api = apiCallers[0].tags;

    // Create 150 tags
    const tagPromises = [];
    for (let i = 0; i < 150; i++) {
      tagPromises.push(api.create({ name: `tag-${i}` }));
    }
    await Promise.all(tagPromises);

    // Try to get more than max limit - should throw validation error
    await expect(() => api.list({ limit: 200 })).rejects.toThrow(
      /less than or equal to 100/,
    );

    // Verify max limit works correctly
    const result = await api.list({ limit: 100 });
    expect(result.tags).toHaveLength(100);
    expect(result.total).toBe(150);
    expect(result.hasMore).toBe(true);
  });

  test<CustomTestContext>("should handle offset beyond total count", async ({
    apiCallers,
  }) => {
    const api = apiCallers[0].tags;

    // Create 10 tags
    const tagPromises = [];
    for (let i = 0; i < 10; i++) {
      tagPromises.push(api.create({ name: `tag-${i}` }));
    }
    await Promise.all(tagPromises);

    // Request with offset beyond total
    const result = await api.list({ limit: 10, offset: 20 });

    expect(result.tags).toHaveLength(0);
    expect(result.total).toBe(10);
    expect(result.hasMore).toBe(false);
  });

  test<CustomTestContext>("should work without pagination parameters (backwards compatibility)", async ({
    apiCallers,
  }) => {
    const api = apiCallers[0].tags;

    // Create 75 tags
    const tagPromises = [];
    for (let i = 0; i < 75; i++) {
      tagPromises.push(api.create({ name: `tag-${i}` }));
    }
    await Promise.all(tagPromises);

    // Call without any parameters
    const result = await api.list();

    expect(result.tags).toHaveLength(50); // Default limit
    expect(result.total).toBe(75);
    expect(result.hasMore).toBe(true);
  });

  test<CustomTestContext>("should handle pagination for many tags efficiently", async ({
    apiCallers,
  }) => {
    const api = apiCallers[0].tags;

    // Create 250 tags (simulating a scaled-down version of issue #1404)
    const batchSize = 50;
    for (let batch = 0; batch < 5; batch++) {
      const tagPromises = [];
      for (let i = 0; i < batchSize; i++) {
        const index = batch * batchSize + i;
        tagPromises.push(
          api.create({ name: `tag-${index.toString().padStart(4, "0")}` }),
        );
      }
      await Promise.all(tagPromises);
    }

    // Get first page - should be fast even with many tags
    const startTime = Date.now();
    const result = await api.list({ limit: 100 });
    const endTime = Date.now();

    expect(result.tags).toHaveLength(100);
    expect(result.total).toBe(250);
    expect(result.hasMore).toBe(true);

    // Query should be fast (less than 500ms for test environment)
    expect(endTime - startTime).toBeLessThan(500);
  });

  test<CustomTestContext>("should only return tags for the authenticated user", async ({
    apiCallers,
  }) => {
    const api1 = apiCallers[0].tags;
    const api2 = apiCallers[1].tags;

    // Create tags for user 1
    await api1.create({ name: "user1-tag-1" });
    await api1.create({ name: "user1-tag-2" });

    // Create tags for user 2
    await api2.create({ name: "user2-tag-1" });
    await api2.create({ name: "user2-tag-2" });

    // Get tags for user 1 - should only see own tags
    const result1 = await api1.list();
    expect(result1.tags).toHaveLength(2);
    expect(result1.total).toBe(2);
    expect(result1.hasMore).toBe(false);
    expect(result1.tags.every((t) => t.name.startsWith("user1-tag"))).toBe(
      true,
    );

    // Get tags for user 2 - should only see own tags
    const result2 = await api2.list();
    expect(result2.tags).toHaveLength(2);
    expect(result2.total).toBe(2);
    expect(result2.hasMore).toBe(false);
    expect(result2.tags.every((t) => t.name.startsWith("user2-tag"))).toBe(
      true,
    );
  });

  test<CustomTestContext>("should include correct tag counts in pagination results", async ({
    apiCallers,
  }) => {
    const api = apiCallers[0].tags;

    // Create some tags
    await api.create({ name: "tag-with-bookmarks" });
    await api.create({ name: "tag-without-bookmarks" });

    const result = await api.list();

    // All tags should have proper structure
    expect(result.tags).toHaveLength(2);
    result.tags.forEach((tag) => {
      expect(tag).toHaveProperty("id");
      expect(tag).toHaveProperty("name");
      expect(tag).toHaveProperty("numBookmarks");
      expect(tag).toHaveProperty("numBookmarksByAttachedType");
      expect(tag.numBookmarksByAttachedType).toHaveProperty("ai");
      expect(tag.numBookmarksByAttachedType).toHaveProperty("human");
    });
  });
});
