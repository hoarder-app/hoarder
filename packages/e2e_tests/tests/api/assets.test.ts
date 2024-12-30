import { createHoarderClient } from "@hoarderapp/sdk";
import { assert, beforeEach, describe, expect, inject, it } from "vitest";

import { createTestUser, uploadTestAsset } from "../../utils/api";

describe("Assets API", () => {
  const port = inject("hoarderPort");

  if (!port) {
    throw new Error("Missing required environment variables");
  }

  let client: ReturnType<typeof createHoarderClient>;
  let apiKey: string;

  beforeEach(async () => {
    apiKey = await createTestUser();
    client = createHoarderClient({
      baseUrl: `http://localhost:${port}/api/v1/`,
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
    });
  });

  it("should upload and retrieve an asset", async () => {
    // Create a test file
    const file = new File(["test content"], "test.pdf", {
      type: "application/pdf",
    });

    // Upload the asset
    const uploadResponse = await uploadTestAsset(apiKey, port, file);
    expect(uploadResponse.assetId).toBeDefined();
    expect(uploadResponse.contentType).toBe("application/pdf");
    expect(uploadResponse.fileName).toBe("test.pdf");

    // Retrieve the asset
    const resp = await fetch(
      `http://localhost:${port}/api/assets/${uploadResponse.assetId}`,
      {
        headers: {
          authorization: `Bearer ${apiKey}`,
        },
      },
    );

    expect(resp.status).toBe(200);
  });

  it("should attach an asset to a bookmark", async () => {
    // Create a test file
    const file = new File(["test content"], "test.pdf", {
      type: "application/pdf",
    });

    // Upload the asset
    const uploadResponse = await uploadTestAsset(apiKey, port, file);

    // Create a bookmark
    const { data: createdBookmark } = await client.POST("/bookmarks", {
      body: {
        type: "asset",
        title: "Test Asset Bookmark",
        assetType: "pdf",
        assetId: uploadResponse.assetId,
      },
    });

    expect(createdBookmark).toBeDefined();
    expect(createdBookmark?.id).toBeDefined();

    // Get the bookmark and verify asset
    const { data: retrievedBookmark } = await client.GET(
      "/bookmarks/{bookmarkId}",
      {
        params: {
          path: {
            bookmarkId: createdBookmark!.id,
          },
        },
      },
    );

    expect(retrievedBookmark).toBeDefined();
    assert(retrievedBookmark!.content.type === "asset");
    expect(retrievedBookmark!.content.assetId).toBe(uploadResponse.assetId);
  });

  it("should delete asset when deleting bookmark", async () => {
    // Create a test file
    const file = new File(["test content"], "test.pdf", {
      type: "application/pdf",
    });

    // Upload the asset
    const uploadResponse = await uploadTestAsset(apiKey, port, file);

    // Create a bookmark
    const { data: createdBookmark } = await client.POST("/bookmarks", {
      body: {
        type: "asset",
        title: "Test Asset Bookmark",
        assetType: "pdf",
        assetId: uploadResponse.assetId,
      },
    });

    // Delete the bookmark
    const { response: deleteResponse } = await client.DELETE(
      "/bookmarks/{bookmarkId}",
      {
        params: {
          path: {
            bookmarkId: createdBookmark!.id,
          },
        },
      },
    );
    expect(deleteResponse.status).toBe(204);

    // Verify asset is deleted
    const assetResponse = await fetch(
      `http://localhost:${port}/api/assets/${uploadResponse.assetId}`,
      {
        headers: {
          authorization: `Bearer ${apiKey}`,
        },
      },
    );
    expect(assetResponse.status).toBe(404);
  });
});
