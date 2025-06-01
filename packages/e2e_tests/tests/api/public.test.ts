import { assert, beforeEach, describe, expect, inject, it } from "vitest";
import { z } from "zod";

import { createSignedToken } from "../../../shared/signedTokens";
import { zAssetSignedTokenSchema } from "../../../shared/types/assets";
import { BookmarkTypes } from "../../../shared/types/bookmarks";
import { createTestUser, uploadTestAsset } from "../../utils/api";
import { waitUntil } from "../../utils/general";
import { getTrpcClient } from "../../utils/trpc";

describe("Public API", () => {
  const port = inject("karakeepPort");

  if (!port) {
    throw new Error("Missing required environment variables");
  }

  let apiKey: string;

  async function seedDatabase() {
    const trpcClient = getTrpcClient(apiKey);

    // Create two lists
    const publicList = await trpcClient.lists.create.mutate({
      name: "Public List",
      icon: "🚀",
      type: "manual",
    });

    await trpcClient.lists.edit.mutate({
      listId: publicList.id,
      public: true,
    });

    // Create two bookmarks
    const createBookmark1 = await trpcClient.bookmarks.createBookmark.mutate({
      title: "Test Bookmark #1",
      url: "http://nginx:80/hello.html",
      type: BookmarkTypes.LINK,
    });

    // Create a second bookmark with an asset
    const file = new File(["test content"], "test.pdf", {
      type: "application/pdf",
    });

    const uploadResponse = await uploadTestAsset(apiKey, port, file);
    const createBookmark2 = await trpcClient.bookmarks.createBookmark.mutate({
      title: "Test Bookmark #2",
      type: BookmarkTypes.ASSET,
      assetType: "pdf",
      assetId: uploadResponse.assetId,
    });

    await trpcClient.lists.addToList.mutate({
      listId: publicList.id,
      bookmarkId: createBookmark1.id,
    });
    await trpcClient.lists.addToList.mutate({
      listId: publicList.id,
      bookmarkId: createBookmark2.id,
    });

    return { publicList, createBookmark1, createBookmark2 };
  }

  beforeEach(async () => {
    apiKey = await createTestUser();
  });

  it("should get public bookmarks", async () => {
    const { publicList } = await seedDatabase();
    const trpcClient = getTrpcClient(apiKey);

    const res = await trpcClient.publicBookmarks.getPublicBookmarksInList.query(
      {
        listId: publicList.id,
      },
    );

    expect(res.bookmarks.length).toBe(2);
  });

  it("should be able to access the assets of the public bookmarks", async () => {
    const { publicList, createBookmark1, createBookmark2 } =
      await seedDatabase();

    const trpcClient = getTrpcClient(apiKey);
    await waitUntil(
      async () => {
        const res = await trpcClient.bookmarks.getBookmark.query({
          bookmarkId: createBookmark1.id,
        });
        assert(res.content.type === BookmarkTypes.LINK);
        return res.content.crawledAt !== null;
      },
      "Bookmark is crawled",
      10000,
    );

    const res = await trpcClient.publicBookmarks.getPublicBookmarksInList.query(
      {
        listId: publicList.id,
      },
    );

    const b1Resp = res.bookmarks.find((b) => b.id === createBookmark1.id);
    expect(b1Resp).toBeDefined();
    const b2Resp = res.bookmarks.find((b) => b.id === createBookmark2.id);
    expect(b2Resp).toBeDefined();

    assert(b1Resp!.content.type === BookmarkTypes.LINK);
    assert(b2Resp!.content.type === BookmarkTypes.ASSET);

    {
      // Banner image fetch
      assert(b1Resp!.bannerImageUrl);
      const assetFetch = await fetch(b1Resp!.bannerImageUrl);
      expect(assetFetch.status).toBe(200);
    }

    {
      // Actual asset fetch
      const assetFetch = await fetch(b2Resp!.content.assetUrl);
      expect(assetFetch.status).toBe(200);
    }
  });

  it("Accessing non public list should fail", async () => {
    const trpcClient = getTrpcClient(apiKey);
    const nonPublicList = await trpcClient.lists.create.mutate({
      name: "Non Public List",
      icon: "🚀",
      type: "manual",
    });

    expect(
      trpcClient.publicBookmarks.getPublicBookmarksInList.query({
        listId: nonPublicList.id,
      }),
    ).rejects.toThrow(/List not found/);
  });

  describe("Public asset token validation", () => {
    let assetId: string;
    let userId: string;

    beforeEach(async () => {
      const trpcClient = getTrpcClient(apiKey);
      const whoami = await trpcClient.users.whoami.query();
      userId = whoami.id;
      const asset = await uploadTestAsset(
        apiKey,
        port,
        new File(["test content"], "test.pdf", {
          type: "application/pdf",
        }),
      );
      assetId = asset.assetId;
    });

    it("should succeed with a valid token", async () => {
      // ASSUMPTION: The same nextauth secret is used for all tests (and the containers)
      const token = createSignedToken(
        {
          assetId,
          userId,
        } as z.infer<typeof zAssetSignedTokenSchema>,
        Date.now() + 60,
      );
      const res = await fetch(
        `http://localhost:${port}/api/public/assets/${assetId}?token=${token}`,
      );
      expect(res.status).toBe(200);
    });

    it("should fail without a token", async () => {
      const res = await fetch(
        `http://localhost:${port}/api/public/assets/${assetId}`,
      );
      expect(res.status).toBe(400);
    });

    it("should fail with a bad token", async () => {
      const res = await fetch(
        `http://localhost:${port}/api/public/assets/${assetId}?token=invalid`,
      );
      expect(res.status).toBe(403);
      expect(await res.text()).toMatch(/Invalid or expired token/);
    });

    it("should fail after token expiry", async () => {
      const token = createSignedToken(
        {
          assetId,
          userId,
        } as z.infer<typeof zAssetSignedTokenSchema>,
        Date.now() + 5,
      );
      let res = await fetch(
        `http://localhost:${port}/api/public/assets/${assetId}?token=${token}`,
      );
      expect(res.status).toBe(200);

      // Sleep for 10 seconds
      await new Promise((resolve) => setTimeout(resolve, 10000));

      // Token should fail after expiry
      res = await fetch(
        `http://localhost:${port}/api/public/assets/${assetId}?token=${token}`,
      );
      expect(res.status).toBe(403);
    });

    it("should fail when using a valid token for a different asset", async () => {
      const anotherAsset = await uploadTestAsset(
        apiKey,
        port,
        new File(["test content"], "test.pdf", {
          type: "application/pdf",
        }),
      );
      const token = createSignedToken(
        {
          assetId: anotherAsset.assetId,
          userId,
        } as z.infer<typeof zAssetSignedTokenSchema>,
        Date.now() + 60,
      );
      let res = await fetch(
        `http://localhost:${port}/api/public/assets/${anotherAsset.assetId}?token=${token}`,
      );
      expect(res.status).toBe(200);

      // Using a valid token for a different asset should fail
      res = await fetch(
        `http://localhost:${port}/api/public/assets/${assetId}?token=${token}`,
      );
      expect(res.status).toBe(403);
    });
  });
});
