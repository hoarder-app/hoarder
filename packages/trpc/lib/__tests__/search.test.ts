import { beforeEach, describe, expect, it } from "vitest";

import { getInMemoryDB } from "@karakeep/db/drizzle";
import {
  bookmarkAssets,
  bookmarkLinks,
  bookmarkLists,
  bookmarks,
  bookmarksInLists,
  bookmarkTags,
  bookmarkTexts,
  highlights,
  listCollaborators,
  rssFeedImportsTable,
  rssFeedsTable,
  tagsOnBookmarks,
  users,
} from "@karakeep/db/schema";
import { BookmarkTypes } from "@karakeep/shared/types/bookmarks";
import { Matcher } from "@karakeep/shared/types/search";

import { AuthedContext } from "../..";
import { getBookmarkIdsFromMatcher, getSharedBookmarkIds } from "../search";

let mockCtx: AuthedContext;
let testUserId: string;

beforeEach(async () => {
  const db = getInMemoryDB(true);
  testUserId = "test-user";

  await db.insert(users).values([
    {
      id: testUserId,
      name: "Test User",
      email: "test@example.com",
      role: "user",
    },
    {
      id: "other-user",
      name: "Other User",
      email: "other@example.com",
      role: "user",
    },
  ]);

  // Setup test data
  await db.insert(bookmarks).values([
    {
      id: "b1",
      type: BookmarkTypes.LINK,
      userId: testUserId,
      archived: false,
      favourited: false,
      createdAt: new Date("2024-01-01"),
      title: null,
      note: "A bookmark note",
    },
    {
      id: "b2",
      type: BookmarkTypes.LINK,
      userId: testUserId,
      archived: true,
      favourited: true,
      createdAt: new Date("2024-01-02"),
      title: "example domain page",
      note: "",
    },
    {
      id: "b3",
      type: BookmarkTypes.TEXT,
      userId: testUserId,
      archived: true,
      favourited: false,
      createdAt: new Date("2024-01-03"),
      title: "third bookmark",
    },
    {
      id: "b4",
      type: BookmarkTypes.LINK,
      userId: testUserId,
      archived: false,
      favourited: true,
      createdAt: new Date("2024-01-04"),
      title: "another example page",
    },
    {
      id: "b5",
      type: BookmarkTypes.TEXT,
      userId: testUserId,
      archived: false,
      favourited: false,
      createdAt: new Date("2024-01-05"),
      title: "fifth text",
    },
    {
      id: "b6",
      type: BookmarkTypes.ASSET,
      userId: testUserId,
      archived: true,
      favourited: false,
      createdAt: new Date("2024-01-06"),
      title: "example asset",
    },
    {
      id: "b7",
      type: BookmarkTypes.TEXT,
      userId: "other-user",
      archived: false,
      favourited: false,
      createdAt: new Date("2024-01-07"),
      title: "another user's bookmark",
      note: "Another user's note",
    },
  ]);

  await db.insert(bookmarkLinks).values([
    { id: "b1", url: "https://example.com/page1", title: "example link" },
    { id: "b2", url: "https://test.com/page2" },
    { id: "b4", url: "https://example.com/page3" },
  ]);

  await db.insert(bookmarkTexts).values([
    {
      id: "b3",
      text: "This is a test bookmark",
      sourceUrl: "https://example.com/page1",
    },
    {
      id: "b5",
      text: "Another text bookmark",
      sourceUrl: null,
    },
  ]);

  await db.insert(bookmarkAssets).values([
    {
      id: "b6",
      assetType: "image",
      fileName: "test.png",
      assetId: "asset-id",
      sourceUrl: "https://example.com/image.png",
    },
  ]);

  await db.insert(highlights).values([
    {
      id: "h1",
      bookmarkId: "b3",
      userId: testUserId,
      startOffset: 0,
      endOffset: 4,
      text: "This",
    },
    {
      id: "h2",
      bookmarkId: "b4",
      userId: "other-user",
      startOffset: 0,
      endOffset: 7,
      text: "Another",
    },
  ]);

  await db.insert(bookmarkTags).values([
    { id: "t1", userId: testUserId, name: "tag1" },
    { id: "t2", userId: testUserId, name: "tag2" },
    { id: "t3", userId: testUserId, name: "important" },
    { id: "t4", userId: testUserId, name: "work" },
  ]);

  await db.insert(tagsOnBookmarks).values([
    { bookmarkId: "b1", tagId: "t1", attachedBy: "ai" },
    { bookmarkId: "b2", tagId: "t2", attachedBy: "ai" },
    { bookmarkId: "b4", tagId: "t3", attachedBy: "human" },
    { bookmarkId: "b5", tagId: "t4", attachedBy: "human" },
    { bookmarkId: "b6", tagId: "t3", attachedBy: "ai" },
  ]);

  await db.insert(bookmarkLists).values([
    { id: "l1", userId: testUserId, name: "list1", icon: "🚀", type: "manual" },
    { id: "l2", userId: testUserId, name: "list2", icon: "🚀", type: "manual" },
    {
      id: "l3",
      userId: testUserId,
      name: "favorites",
      icon: "⭐",
      type: "manual",
    },
    { id: "l4", userId: testUserId, name: "work", icon: "💼", type: "manual" },
  ]);

  await db.insert(bookmarksInLists).values([
    { bookmarkId: "b1", listId: "l1" },
    { bookmarkId: "b2", listId: "l2" },
    { bookmarkId: "b4", listId: "l3" },
    { bookmarkId: "b5", listId: "l4" },
    { bookmarkId: "b6", listId: "l1" },
  ]);

  await db.insert(rssFeedsTable).values([
    { id: "f1", userId: testUserId, name: "feed1", url: "url1" },
    { id: "f2", userId: testUserId, name: "feed2", url: "url2" },
  ]);

  await db.insert(rssFeedImportsTable).values([
    {
      id: "imp1",
      entryId: "entry1",
      rssFeedId: "f1",
      bookmarkId: "b1",
    },
    {
      id: "imp2",
      entryId: "entry2",
      rssFeedId: "f2",
      bookmarkId: "b3",
    },
    {
      id: "imp3",
      entryId: "entry3",
      rssFeedId: "f1",
      bookmarkId: "b5",
    },
  ]);

  mockCtx = {
    db,
    user: {
      id: testUserId,
      name: "Test User",
      email: "test@example.com",
      role: "user",
    },
    req: {
      ip: "127.0.0.1",
    },
  };
});

describe("getBookmarkIdsFromMatcher", () => {
  it("should handle tagName matcher", async () => {
    const matcher: Matcher = {
      type: "tagName",
      tagName: "tag1",
      inverse: false,
    };
    const result = await getBookmarkIdsFromMatcher(mockCtx, matcher);
    expect(result).toEqual(["b1"]);
  });

  it("should handle tagName matcher with inverse=true", async () => {
    const matcher: Matcher = {
      type: "tagName",
      tagName: "tag1",
      inverse: true,
    };
    const result = await getBookmarkIdsFromMatcher(mockCtx, matcher);
    expect(result.sort()).toEqual(["b2", "b3", "b4", "b5", "b6"]);
  });

  it("should handle listName matcher", async () => {
    const matcher: Matcher = {
      type: "listName",
      listName: "list1",
      inverse: false,
    };
    const result = await getBookmarkIdsFromMatcher(mockCtx, matcher);
    expect(result).toEqual(["b1", "b6"]);
  });

  it("should handle listName matcher with inverse=true", async () => {
    const matcher: Matcher = {
      type: "listName",
      listName: "list1",
      inverse: true,
    };
    const result = await getBookmarkIdsFromMatcher(mockCtx, matcher);
    expect(result.sort()).toEqual(["b2", "b3", "b4", "b5"]);
  });

  it("should handle listName matcher when multiple lists share the same name", async () => {
    await mockCtx.db.insert(bookmarkLists).values({
      id: "l5",
      userId: testUserId,
      name: "list1",
      icon: "🚀",
      type: "manual",
    });
    await mockCtx.db.insert(bookmarksInLists).values({
      bookmarkId: "b2",
      listId: "l5",
    });

    const matcher: Matcher = {
      type: "listName",
      listName: "list1",
      inverse: false,
    };
    const result = await getBookmarkIdsFromMatcher(mockCtx, matcher);
    expect(result.sort()).toEqual(["b1", "b2", "b6"]);
  });

  it("should handle inverse listName matcher when multiple lists share the same name", async () => {
    await mockCtx.db.insert(bookmarkLists).values({
      id: "l5",
      userId: testUserId,
      name: "list1",
      icon: "🚀",
      type: "manual",
    });
    await mockCtx.db.insert(bookmarksInLists).values({
      bookmarkId: "b2",
      listId: "l5",
    });

    const matcher: Matcher = {
      type: "listName",
      listName: "list1",
      inverse: true,
    };
    const result = await getBookmarkIdsFromMatcher(mockCtx, matcher);
    expect(result.sort()).toEqual(["b3", "b4", "b5"]);
  });

  it("should return empty when inverse listName references a missing list", async () => {
    const matcher: Matcher = {
      type: "listName",
      listName: "does-not-exist",
      inverse: true,
    };

    const result = await getBookmarkIdsFromMatcher(mockCtx, matcher);
    expect(result).toEqual([]);
  });

  it("should handle archived matcher", async () => {
    const matcher: Matcher = { type: "archived", archived: true };
    const result = await getBookmarkIdsFromMatcher(mockCtx, matcher);
    expect(result).toEqual(["b2", "b3", "b6"]);
  });

  it("should handle archived matcher archived=false", async () => {
    const matcher: Matcher = { type: "archived", archived: false };
    const result = await getBookmarkIdsFromMatcher(mockCtx, matcher);
    expect(result).toEqual(["b1", "b4", "b5"]);
  });

  it("should handle favourited matcher", async () => {
    const matcher: Matcher = { type: "favourited", favourited: true };
    const result = await getBookmarkIdsFromMatcher(mockCtx, matcher);
    expect(result).toEqual(["b2", "b4"]);
  });

  it("should handle favourited matcher favourited=false", async () => {
    const matcher: Matcher = { type: "favourited", favourited: false };
    const result = await getBookmarkIdsFromMatcher(mockCtx, matcher);
    expect(result).toEqual(["b1", "b3", "b5", "b6"]);
  });

  it("should handle hasNotes matcher", async () => {
    const matcher: Matcher = { type: "hasNotes", hasNotes: true };
    const result = await getBookmarkIdsFromMatcher(mockCtx, matcher);
    expect(result).toEqual(["b1"]);
  });

  it("should handle hasNotes matcher with hasNotes=false", async () => {
    const matcher: Matcher = { type: "hasNotes", hasNotes: false };
    const result = await getBookmarkIdsFromMatcher(mockCtx, matcher);
    expect(result.sort()).toEqual(["b2", "b3", "b4", "b5", "b6"]);
  });

  it("should handle hasHighlights matcher for the current user", async () => {
    const matcher: Matcher = {
      type: "hasHighlights",
      hasHighlights: true,
    };
    const result = await getBookmarkIdsFromMatcher(mockCtx, matcher);
    expect(result).toEqual(["b3"]);
  });

  it("should handle hasHighlights=false and ignore another user's highlights", async () => {
    const matcher: Matcher = {
      type: "hasHighlights",
      hasHighlights: false,
    };
    const result = await getBookmarkIdsFromMatcher(mockCtx, matcher);
    expect(result.sort()).toEqual(["b1", "b2", "b4", "b5", "b6"]);
  });

  it("should handle url matcher", async () => {
    const matcher: Matcher = {
      type: "url",
      url: "example.com",
      inverse: false,
    };
    const result = await getBookmarkIdsFromMatcher(mockCtx, matcher);
    expect(result).toEqual(["b1", "b4", "b6"]);
  });

  it("should handle url matcher with inverse=true", async () => {
    const matcher: Matcher = {
      type: "url",
      url: "example.com",
      inverse: true,
    };
    const result = await getBookmarkIdsFromMatcher(mockCtx, matcher);
    // Not that only bookmarks of type link are returned
    expect(result.sort()).toEqual(["b2"]);
  });

  it("should handle title matcher", async () => {
    const matcher: Matcher = {
      type: "title",
      title: "example",
      inverse: false,
    };
    const result = await getBookmarkIdsFromMatcher(mockCtx, matcher);
    expect(result.sort()).toEqual(["b1", "b2", "b4", "b6"]);
  });

  it("should handle title matcher with inverse=true", async () => {
    const matcher: Matcher = {
      type: "title",
      title: "example",
      inverse: true,
    };
    const result = await getBookmarkIdsFromMatcher(mockCtx, matcher);
    expect(result.sort()).toEqual(["b3", "b5"]);
  });

  it("should handle dateAfter matcher", async () => {
    const matcher: Matcher = {
      type: "dateAfter",
      dateAfter: new Date("2024-01-02"),
      inverse: false,
    };
    const result = await getBookmarkIdsFromMatcher(mockCtx, matcher);
    expect(result).toEqual(["b2", "b3", "b4", "b5", "b6"]);
  });

  it("should handle dateAfter matcher with inverse=true", async () => {
    const matcher: Matcher = {
      type: "dateAfter",
      dateAfter: new Date("2024-01-02"),
      inverse: true,
    };
    const result = await getBookmarkIdsFromMatcher(mockCtx, matcher);
    expect(result).toEqual(["b1"]);
  });

  it("should handle dateBefore matcher", async () => {
    const matcher: Matcher = {
      type: "dateBefore",
      dateBefore: new Date("2024-01-02"),
      inverse: false,
    };
    const result = await getBookmarkIdsFromMatcher(mockCtx, matcher);
    expect(result).toEqual(["b1", "b2"]);
  });

  it("should handle type matcher", async () => {
    expect(
      (
        await getBookmarkIdsFromMatcher(mockCtx, {
          type: "type",
          typeName: BookmarkTypes.LINK,
          inverse: false,
        })
      ).sort(),
    ).toEqual(["b1", "b2", "b4"]);
    expect(
      (
        await getBookmarkIdsFromMatcher(mockCtx, {
          type: "type",
          typeName: BookmarkTypes.TEXT,
          inverse: false,
        })
      ).sort(),
    ).toEqual(["b3", "b5"]);
    expect(
      await getBookmarkIdsFromMatcher(mockCtx, {
        type: "type",
        typeName: BookmarkTypes.ASSET,
        inverse: false,
      }),
    ).toEqual(["b6"]);
  });

  it("should handle type matcher with inverse=true", async () => {
    expect(
      (
        await getBookmarkIdsFromMatcher(mockCtx, {
          type: "type",
          typeName: BookmarkTypes.LINK,
          inverse: true,
        })
      ).sort(),
    ).toEqual(["b3", "b5", "b6"]);
    expect(
      (
        await getBookmarkIdsFromMatcher(mockCtx, {
          type: "type",
          typeName: BookmarkTypes.TEXT,
          inverse: true,
        })
      ).sort(),
    ).toEqual(["b1", "b2", "b4", "b6"]);
    expect(
      (
        await getBookmarkIdsFromMatcher(mockCtx, {
          type: "type",
          typeName: BookmarkTypes.ASSET,
          inverse: true,
        })
      ).sort(),
    ).toEqual(["b1", "b2", "b3", "b4", "b5"]);
  });

  it("should handle dateBefore matcher with inverse=true", async () => {
    const matcher: Matcher = {
      type: "dateBefore",
      dateBefore: new Date("2024-01-02"),
      inverse: true,
    };
    const result = await getBookmarkIdsFromMatcher(mockCtx, matcher);
    expect(result.sort()).toEqual(["b3", "b4", "b5", "b6"]);
  });

  it("should handle AND matcher", async () => {
    const matcher: Matcher = {
      type: "and",
      matchers: [
        { type: "archived", archived: true },
        { type: "favourited", favourited: true },
      ],
    };
    const result = await getBookmarkIdsFromMatcher(mockCtx, matcher);
    expect(result).toEqual(["b2"]);
  });

  it("should handle OR matcher #1", async () => {
    const matcher: Matcher = {
      type: "or",
      matchers: [
        { type: "archived", archived: true },
        { type: "favourited", favourited: true },
      ],
    };
    const result = await getBookmarkIdsFromMatcher(mockCtx, matcher);
    expect(result.sort()).toEqual(["b2", "b3", "b4", "b6"]);
  });

  it("should handle OR matcher #2", async () => {
    const matcher: Matcher = {
      type: "or",
      matchers: [
        { type: "listName", listName: "favorites", inverse: false },
        { type: "tagName", tagName: "work", inverse: false },
      ],
    };
    const result = await getBookmarkIdsFromMatcher(mockCtx, matcher);
    expect(result).toEqual(["b4", "b5"]);
  });

  it("should handle nested complex matchers", async () => {
    const matcher: Matcher = {
      type: "and",
      matchers: [
        {
          type: "or",
          matchers: [
            { type: "listName", listName: "favorites", inverse: false },
            { type: "tagName", tagName: "work", inverse: false },
          ],
        },
        {
          type: "or",
          matchers: [
            { type: "archived", archived: true },
            { type: "favourited", favourited: true },
          ],
        },
      ],
    };
    const result = await getBookmarkIdsFromMatcher(mockCtx, matcher);
    expect(result).toEqual(["b4"]);
  });

  it("should handle tagged matcher", async () => {
    const matcher: Matcher = { type: "tagged", tagged: true };
    const result = await getBookmarkIdsFromMatcher(mockCtx, matcher);
    expect(result.sort()).toEqual(["b1", "b2", "b4", "b5", "b6"]);
  });

  it("should handle tagged matcher with tagged=false", async () => {
    const matcher: Matcher = { type: "tagged", tagged: false };
    const result = await getBookmarkIdsFromMatcher(mockCtx, matcher);
    expect(result).toEqual(["b3"]);
  });

  it("should handle inlist matcher", async () => {
    const matcher: Matcher = { type: "inlist", inList: true };
    const result = await getBookmarkIdsFromMatcher(mockCtx, matcher);
    expect(result.sort()).toEqual(["b1", "b2", "b4", "b5", "b6"]);
  });

  it("should handle inlist matcher with inList=false", async () => {
    const matcher: Matcher = { type: "inlist", inList: false };
    const result = await getBookmarkIdsFromMatcher(mockCtx, matcher);
    expect(result).toEqual(["b3"]);
  });

  it("should handle rssFeedName matcher", async () => {
    const matcher: Matcher = {
      type: "rssFeedName",
      feedName: "feed1",
      inverse: false,
    };
    const result = await getBookmarkIdsFromMatcher(mockCtx, matcher);
    expect(result.sort()).toEqual(["b1", "b5"]);
  });

  it("should handle rssFeedName matcher with inverse=true", async () => {
    const matcher: Matcher = {
      type: "rssFeedName",
      feedName: "feed1",
      inverse: true,
    };
    const result = await getBookmarkIdsFromMatcher(mockCtx, matcher);
    expect(result.sort()).toEqual(["b2", "b3", "b4", "b6"]);
  });

  it("should throw error for unknown matcher type", async () => {
    const matcher = { type: "unknown" } as unknown as Matcher;
    await expect(getBookmarkIdsFromMatcher(mockCtx, matcher)).rejects.toThrow(
      "Unknown matcher type",
    );
  });
});

describe("getBookmarkIdsFromMatcher with shared lists", () => {
  /**
   * `other-user` owns "SharedList", which contains their bookmark `b7` and is
   * shared with the test user. `third-user` owns "PrivateList" with `b8`, which
   * is shared with nobody.
   */
  beforeEach(async () => {
    await mockCtx.db.insert(users).values({
      id: "third-user",
      name: "Third User",
      email: "third@example.com",
      role: "user",
    });
    await mockCtx.db.insert(bookmarks).values({
      id: "b8",
      type: BookmarkTypes.LINK,
      userId: "third-user",
      archived: false,
      favourited: false,
      createdAt: new Date("2024-01-08"),
      title: "a private page",
    });
    await mockCtx.db.insert(bookmarkLinks).values([
      { id: "b7", url: "https://shared.example/page7", title: "shared link" },
      { id: "b8", url: "https://private.example/page8", title: "private link" },
    ]);
    await mockCtx.db.insert(bookmarkLists).values([
      {
        id: "l-shared",
        userId: "other-user",
        name: "SharedList",
        icon: "🤝",
        type: "manual",
      },
      {
        id: "l-private",
        userId: "third-user",
        name: "PrivateList",
        icon: "🔒",
        type: "manual",
      },
    ]);
    await mockCtx.db.insert(bookmarksInLists).values([
      { bookmarkId: "b7", listId: "l-shared" },
      { bookmarkId: "b8", listId: "l-private" },
    ]);
    await mockCtx.db.insert(listCollaborators).values({
      id: "collab-1",
      listId: "l-shared",
      userId: testUserId,
      role: "viewer",
    });
  });

  describe("list: qualifier", () => {
    it("resolves a list shared with the user in the visible scope", async () => {
      const result = await getBookmarkIdsFromMatcher(
        mockCtx,
        { type: "listName", listName: "SharedList", inverse: false },
        "visible",
      );
      expect(result).toEqual(["b7"]);
    });

    it("does not resolve a shared list in the default owned scope", async () => {
      const result = await getBookmarkIdsFromMatcher(mockCtx, {
        type: "listName",
        listName: "SharedList",
        inverse: false,
      });
      expect(result).toEqual([]);
    });

    it("never resolves a list the user has no access to", async () => {
      const result = await getBookmarkIdsFromMatcher(
        mockCtx,
        { type: "listName", listName: "PrivateList", inverse: false },
        "visible",
      );
      expect(result).toEqual([]);
    });

    it("excludes the shared list's bookmarks for an inverse qualifier", async () => {
      const result = await getBookmarkIdsFromMatcher(
        mockCtx,
        { type: "listName", listName: "SharedList", inverse: true },
        "visible",
      );
      expect(result.sort()).toEqual(["b1", "b2", "b3", "b4", "b5", "b6"]);
    });
  });

  describe("content qualifiers", () => {
    it("matches a shared bookmark by title", async () => {
      const result = await getBookmarkIdsFromMatcher(
        mockCtx,
        { type: "title", title: "shared", inverse: false },
        "visible",
      );
      expect(result).toEqual(["b7"]);
    });

    it("matches a shared bookmark by url", async () => {
      const result = await getBookmarkIdsFromMatcher(
        mockCtx,
        { type: "url", url: "shared.example", inverse: false },
        "visible",
      );
      expect(result).toEqual(["b7"]);
    });

    it("matches a shared bookmark by inlist", async () => {
      const result = await getBookmarkIdsFromMatcher(
        mockCtx,
        { type: "inlist", inList: true },
        "visible",
      );
      expect(result).toContain("b7");
    });

    it("does not match shared bookmarks in the owned scope", async () => {
      const result = await getBookmarkIdsFromMatcher(mockCtx, {
        type: "title",
        title: "shared",
        inverse: false,
      });
      expect(result).toEqual([]);
    });

    it("never matches bookmarks of users who shared nothing", async () => {
      for (const matcher of [
        { type: "title", title: "private", inverse: false },
        { type: "url", url: "private.example", inverse: false },
        { type: "inlist", inList: true },
      ] as Matcher[]) {
        const result = await getBookmarkIdsFromMatcher(
          mockCtx,
          matcher,
          "visible",
        );
        expect(result).not.toContain("b8");
      }
    });
  });

  describe("owner-private qualifiers", () => {
    it("does not match shared bookmarks by tag", async () => {
      await mockCtx.db.insert(bookmarkTags).values({
        id: "t-other",
        userId: "other-user",
        name: "others-tag",
      });
      await mockCtx.db.insert(tagsOnBookmarks).values({
        bookmarkId: "b7",
        tagId: "t-other",
        attachedBy: "human",
      });

      const result = await getBookmarkIdsFromMatcher(
        mockCtx,
        { type: "tagName", tagName: "others-tag", inverse: false },
        "visible",
      );
      expect(result).toEqual([]);
    });

    it("does not match shared bookmarks by archived or favourited", async () => {
      for (const matcher of [
        { type: "archived", archived: false },
        { type: "favourited", favourited: false },
      ] as Matcher[]) {
        const result = await getBookmarkIdsFromMatcher(
          mockCtx,
          matcher,
          "visible",
        );
        expect(result).not.toContain("b7");
      }
    });
  });

  describe("getSharedBookmarkIds", () => {
    it("returns visible bookmarks the user does not own", async () => {
      expect(await getSharedBookmarkIds(mockCtx)).toEqual(["b7"]);
    });

    it("returns nothing when nothing is shared with the user", async () => {
      await mockCtx.db.delete(listCollaborators);
      expect(await getSharedBookmarkIds(mockCtx)).toEqual([]);
    });

    it("returns a collaborator's bookmark from a list the user owns", async () => {
      // A list owner has no row of their own in listCollaborators, but must
      // still see the bookmarks a collaborator put into their list.
      await mockCtx.db.delete(listCollaborators);
      await mockCtx.db.insert(listCollaborators).values({
        id: "collab-2",
        listId: "l1",
        userId: "other-user",
        role: "editor",
      });
      // l1 is owned by the test user; b7 is owned by other-user.
      await mockCtx.db.insert(bookmarksInLists).values({
        bookmarkId: "b7",
        listId: "l1",
      });

      expect(await getSharedBookmarkIds(mockCtx)).toEqual(["b7"]);
    });
  });
});
