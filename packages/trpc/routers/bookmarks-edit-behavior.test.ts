import { beforeEach, describe, expect, test, vi } from "vitest";

import { BookmarkTypes } from "@karakeep/shared/types/bookmarks";

import type { APICallerType, CustomTestContext } from "../testUtils";
import { defaultBeforeEach } from "../testUtils";

beforeEach<CustomTestContext>(defaultBeforeEach(true));

describe("Bookmark Edit Behavior - Title Changes vs Tag Updates", () => {
  async function createBookmarkWithTitle(
    api: APICallerType["bookmarks"],
    title: string,
    url: string,
  ) {
    const bookmark = await api.createBookmark({
      url,
      type: BookmarkTypes.LINK,
      title,
    });
    return bookmark;
  }

  async function attachTags(
    api: APICallerType["bookmarks"],
    bookmarkId: string,
    tagNames: string[],
  ) {
    await api.updateTags({
      bookmarkId,
      attach: tagNames.map((name) => ({ tagName: name })),
      detach: [],
    });
  }

  test<CustomTestContext>("title edit should be preserved when adding tags", async ({
    apiCallers,
  }) => {
    const api = apiCallers[0].bookmarks;

    // Create bookmark with initial title
    const bookmark = await createBookmarkWithTitle(
      apiCallers[0].bookmarks,
      "Original Title",
      "https://example.com",
    );

    // Edit the title
    await api.updateBookmark({
      bookmarkId: bookmark.id,
      title: "Edited Title",
    });

    // Verify title was updated
    let updatedBookmark = await api.getBookmark({
      bookmarkId: bookmark.id,
    });
    expect(updatedBookmark.title).toEqual("Edited Title");

    // Add tags
    await attachTags(api, bookmark.id, ["tag1", "tag2"]);

    // Verify title is still the edited one
    updatedBookmark = await api.getBookmark({ bookmarkId: bookmark.id });
    expect(updatedBookmark.title).toEqual("Edited Title");
    expect(updatedBookmark.tags).toHaveLength(2);
    expect(updatedBookmark.tags.map((t) => t.name).sort()).toEqual([
      "tag1",
      "tag2",
    ]);
  });

  test<CustomTestContext>("title edit should be preserved when removing tags", async ({
    apiCallers,
  }) => {
    const api = apiCallers[0].bookmarks;

    // Create bookmark with initial title and tags
    const bookmark = await createBookmarkWithTitle(
      apiCallers[0].bookmarks,
      "Original Title",
      "https://example.com",
    );
    await attachTags(api, bookmark.id, ["tag1", "tag2", "tag3"]);

    // Edit the title
    await api.updateBookmark({
      bookmarkId: bookmark.id,
      title: "New Edited Title",
    });

    // Get the tag IDs
    let updatedBookmark = await api.getBookmark({
      bookmarkId: bookmark.id,
    });
    const tag1Id = updatedBookmark.tags.find((t) => t.name === "tag1")!.id;

    // Remove a tag
    await api.updateTags({
      bookmarkId: bookmark.id,
      attach: [],
      detach: [{ tagId: tag1Id }],
    });

    // Verify title is still the edited one
    updatedBookmark = await api.getBookmark({ bookmarkId: bookmark.id });
    expect(updatedBookmark.title).toEqual("New Edited Title");
    expect(updatedBookmark.tags).toHaveLength(2);
    expect(updatedBookmark.tags.map((t) => t.name).sort()).toEqual([
      "tag2",
      "tag3",
    ]);
  });

  test<CustomTestContext>("multiple title edits with tag updates in between", async ({
    apiCallers,
  }) => {
    const api = apiCallers[0].bookmarks;

    // Create bookmark
    const bookmark = await createBookmarkWithTitle(
      apiCallers[0].bookmarks,
      "Title 1",
      "https://example.com",
    );

    // First title edit
    await api.updateBookmark({
      bookmarkId: bookmark.id,
      title: "Title 2",
    });

    // Add tags
    await attachTags(api, bookmark.id, ["tagA"]);

    // Second title edit
    await api.updateBookmark({
      bookmarkId: bookmark.id,
      title: "Title 3",
    });

    // Add more tags
    await attachTags(api, bookmark.id, ["tagB", "tagC"]);

    // Third title edit
    await api.updateBookmark({
      bookmarkId: bookmark.id,
      title: "Title 4",
    });

    // Verify final state
    const finalBookmark = await api.getBookmark({
      bookmarkId: bookmark.id,
    });
    expect(finalBookmark.title).toEqual("Title 4");
    expect(finalBookmark.tags).toHaveLength(3);
    expect(finalBookmark.tags.map((t) => t.name).sort()).toEqual([
      "tagA",
      "tagB",
      "tagC",
    ]);
  });

  test<CustomTestContext>("tag updates should not affect other bookmark fields", async ({
    apiCallers,
  }) => {
    const api = apiCallers[0].bookmarks;

    // Create bookmark with various fields
    const bookmark = await api.createBookmark({
      url: "https://example.com",
      type: BookmarkTypes.LINK,
      title: "Custom Title",
      note: "This is a note",
      summary: "This is a summary",
    });

    // Update to set favourite and archived
    await api.updateBookmark({
      bookmarkId: bookmark.id,
      favourited: true,
      archived: false,
    });

    // Add tags
    await attachTags(api, bookmark.id, ["important", "work"]);

    // Verify all fields are preserved
    const updatedBookmark = await api.getBookmark({
      bookmarkId: bookmark.id,
    });
    expect(updatedBookmark.title).toEqual("Custom Title");
    expect(updatedBookmark.note).toEqual("This is a note");
    expect(updatedBookmark.summary).toEqual("This is a summary");
    expect(updatedBookmark.favourited).toBe(true);
    expect(updatedBookmark.archived).toBe(false);
    expect(updatedBookmark.tags).toHaveLength(2);
  });

  test<CustomTestContext>("empty title should remain empty after tag updates", async ({
    apiCallers,
  }) => {
    const api = apiCallers[0].bookmarks;

    // Create bookmark without explicit title
    const bookmark = await api.createBookmark({
      url: "https://example.com",
      type: BookmarkTypes.LINK,
    });

    // Add tags
    await attachTags(api, bookmark.id, ["notitle"]);

    // Verify title is null/empty
    const updatedBookmark = await api.getBookmark({
      bookmarkId: bookmark.id,
    });
    expect(updatedBookmark.title).toBeNull();
  });

  test<CustomTestContext>("concurrent updates simulation", async ({
    apiCallers,
  }) => {
    const api = apiCallers[0].bookmarks;

    // Create bookmark
    const bookmark = await createBookmarkWithTitle(
      apiCallers[0].bookmarks,
      "Initial",
      "https://example.com",
    );

    // Simulate near-simultaneous updates (in practice these run sequentially in tests)
    const titleUpdate = api.updateBookmark({
      bookmarkId: bookmark.id,
      title: "Updated Title",
    });

    const tagUpdate = attachTags(api, bookmark.id, ["concurrent"]);

    // Wait for both to complete
    await Promise.all([titleUpdate, tagUpdate]);

    // The title should be preserved
    const finalBookmark = await api.getBookmark({
      bookmarkId: bookmark.id,
    });
    expect(finalBookmark.title).toEqual("Updated Title");
    expect(finalBookmark.tags).toHaveLength(1);
    expect(finalBookmark.tags[0].name).toEqual("concurrent");
  });

  test<CustomTestContext>("bulk tag operations should preserve custom titles", async ({
    apiCallers,
  }) => {
    const api = apiCallers[0].bookmarks;

    // Create multiple bookmarks with custom titles
    const bookmarks = await Promise.all([
      createBookmarkWithTitle(
        apiCallers[0].bookmarks,
        "Custom Title 1",
        "https://example1.com",
      ),
      createBookmarkWithTitle(
        apiCallers[0].bookmarks,
        "Custom Title 2",
        "https://example2.com",
      ),
      createBookmarkWithTitle(
        apiCallers[0].bookmarks,
        "Custom Title 3",
        "https://example3.com",
      ),
    ]);

    // Add tags to all bookmarks
    await Promise.all(
      bookmarks.map((b) => attachTags(api, b.id, ["bulk", "test"])),
    );

    // Verify all titles are preserved
    const updatedBookmarks = await Promise.all(
      bookmarks.map((b) => api.getBookmark({ bookmarkId: b.id })),
    );

    expect(updatedBookmarks[0].title).toEqual("Custom Title 1");
    expect(updatedBookmarks[1].title).toEqual("Custom Title 2");
    expect(updatedBookmarks[2].title).toEqual("Custom Title 3");
    updatedBookmarks.forEach((b) => {
      expect(b.tags).toHaveLength(2);
      expect(b.tags.map((t) => t.name).sort()).toEqual(["bulk", "test"]);
    });
  });

  test<CustomTestContext>("title update with special characters and tag updates", async ({
    apiCallers,
  }) => {
    const api = apiCallers[0].bookmarks;

    // Create bookmark
    const bookmark = await createBookmarkWithTitle(
      apiCallers[0].bookmarks,
      "Original",
      "https://example.com",
    );

    // Update with special characters
    const specialTitle = "Title with 特殊文字 & émojis 🎉🎊 and line\nbreaks";
    await api.updateBookmark({
      bookmarkId: bookmark.id,
      title: specialTitle,
    });

    // Add tags
    await attachTags(api, bookmark.id, ["special", "unicode"]);

    // Verify title is preserved exactly
    const updatedBookmark = await api.getBookmark({
      bookmarkId: bookmark.id,
    });
    expect(updatedBookmark.title).toEqual(specialTitle);
    expect(updatedBookmark.tags).toHaveLength(2);
  });

  test<CustomTestContext>("tag operations should not trigger re-crawling", async ({
    apiCallers,
  }) => {
    const api = apiCallers[0].bookmarks;

    // Mock the crawler queue to track calls
    const LinkCrawlerQueue = await import("@karakeep/shared/queues").then(
      (m) => m.LinkCrawlerQueue,
    );
    const enqueueSpy = vi.spyOn(LinkCrawlerQueue, "enqueue");

    // Create bookmark (this will trigger crawling)
    const bookmark = await createBookmarkWithTitle(
      apiCallers[0].bookmarks,
      "Test Title",
      "https://example.com",
    );

    // Reset the spy count
    enqueueSpy.mockClear();

    // Add tags - this should NOT trigger crawling
    await attachTags(api, bookmark.id, ["no-crawl"]);

    // Verify crawler was not called
    expect(enqueueSpy).not.toHaveBeenCalled();

    // Update title - this should also NOT trigger crawling
    await api.updateBookmark({
      bookmarkId: bookmark.id,
      title: "New Title",
    });

    // Verify crawler was still not called
    expect(enqueueSpy).not.toHaveBeenCalled();
  });
});
