import { afterAll, beforeEach, describe, expect, test, vi } from "vitest";

import type { FilterQuery } from "@karakeep/shared/search";
import serverConfig from "@karakeep/shared/config";
import { BookmarkTypes } from "@karakeep/shared/types/bookmarks";

import type { CustomTestContext, APICallerType } from "../testUtils";
import { defaultBeforeEach } from "../testUtils";
import { createSemanticSearchRateLimitMiddleware } from "./bookmarks";

const searchMocks = vi.hoisted(() => ({
  search: vi.fn(),
  vectorSearch: vi.fn(),
  buildEmbeddingClient: vi.fn(),
  getVectorStoreClient: vi.fn(),
  getRateLimitClient: vi.fn(),
  checkRateLimit: vi.fn(),
}));
const originalSemanticSearchFeature =
  serverConfig.experimentalFeatures.semanticSearch;
const originalEmbeddingAutoIndexing = serverConfig.embedding.enableAutoIndexing;

vi.mock("@karakeep/shared/inference", () => ({
  EmbeddingClientFactory: {
    build: searchMocks.buildEmbeddingClient,
  },
}));

vi.mock("@karakeep/shared/search", async (original) => ({
  ...(await original<typeof import("@karakeep/shared/search")>()),
  getSearchClient: vi.fn(async () => ({ search: searchMocks.search })),
}));

vi.mock("@karakeep/shared/vectorStore", async (original) => ({
  ...(await original<typeof import("@karakeep/shared/vectorStore")>()),
  getVectorStoreClient: searchMocks.getVectorStoreClient,
}));

vi.mock("@karakeep/shared/ratelimiting", async (original) => ({
  ...(await original<typeof import("@karakeep/shared/ratelimiting")>()),
  getRateLimitClient: searchMocks.getRateLimitClient,
}));

beforeEach<CustomTestContext>(async (context) => {
  await defaultBeforeEach(true)(context);
  searchMocks.search.mockReset();
  searchMocks.vectorSearch.mockReset();
  searchMocks.buildEmbeddingClient.mockReset();
  searchMocks.getVectorStoreClient.mockReset();
  searchMocks.getRateLimitClient.mockReset();
  searchMocks.checkRateLimit.mockReset();
  searchMocks.getVectorStoreClient.mockResolvedValue({
    search: searchMocks.vectorSearch,
  });
  searchMocks.getRateLimitClient.mockResolvedValue(null);
  serverConfig.experimentalFeatures.semanticSearch = true;
  serverConfig.embedding.enableAutoIndexing = true;
});

afterAll(() => {
  serverConfig.experimentalFeatures.semanticSearch =
    originalSemanticSearchFeature;
  serverConfig.embedding.enableAutoIndexing = originalEmbeddingAutoIndexing;
});

function mockEmbeddingInfra() {
  const generateEmbeddingFromText = vi.fn(async () => ({
    embeddings: [[0.1, 0.2]],
    promptTokens: 1,
    totalTokens: 1,
  }));
  searchMocks.buildEmbeddingClient.mockReturnValue({
    generateEmbeddingFromText,
  });
  return generateEmbeddingFromText;
}

/**
 * A stand-in for the search backend that applies the filters it's given to a
 * fixed set of indexed documents, so tests can assert on the access control the
 * router builds rather than on the backend's ranking.
 */
function mockIndexedBookmarks(docs: { id: string; userId: string }[]) {
  const matches = (
    doc: { id: string; userId: string },
    filter: FilterQuery,
  ): boolean => {
    switch (filter.type) {
      case "eq":
        return doc[filter.field] === filter.value;
      case "in":
        return filter.values.includes(doc[filter.field]);
      case "or":
        return filter.filters.some((f) => matches(doc, f));
    }
  };

  searchMocks.search.mockImplementation(
    async (options: {
      filter?: FilterQuery[];
      limit?: number;
      offset?: number;
    }) => {
      const matched = docs.filter((doc) =>
        (options.filter ?? []).every((filter) => matches(doc, filter)),
      );
      const offset = options.offset ?? 0;
      const limit = options.limit ?? matched.length;
      const page = matched.slice(offset, offset + limit);
      return {
        hits: page.map((doc, i) => ({
          id: doc.id,
          // Rank by position in the full result set, so a page keeps its order.
          score: matched.length - offset - i,
        })),
        totalHits: matched.length,
        processingTimeMs: 1,
      };
    },
  );
}

describe("bookmark search modes", () => {
  test<CustomTestContext>("rejects semantic modes when the experimental feature is disabled", async ({
    apiCallers,
  }) => {
    serverConfig.experimentalFeatures.semanticSearch = false;

    await expect(
      apiCallers[0].bookmarks.searchBookmarks({
        text: "query",
        searchMode: "semantic",
      }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Semantic search is not enabled",
    });
    expect(searchMocks.vectorSearch).not.toHaveBeenCalled();
  });

  test.each(["semantic", "hybrid"] as const)(
    "rate limits %s search",
    async (searchMode) => {
      const next = vi.fn().mockResolvedValue("ok");
      searchMocks.checkRateLimit.mockResolvedValue({ allowed: true });
      searchMocks.getRateLimitClient.mockResolvedValue({
        checkRateLimit: searchMocks.checkRateLimit,
      });
      const wasRateLimitingEnabled = serverConfig.rateLimiting.enabled;
      serverConfig.rateLimiting.enabled = true;

      try {
        const result = await createSemanticSearchRateLimitMiddleware<string>()({
          path: "bookmarks.searchBookmarks",
          ctx: {
            req: { ip: "127.0.0.1" },
            user: { id: "user-123" },
          },
          input: { searchMode },
          next,
        });

        expect(result).toBe("ok");
        expect(searchMocks.checkRateLimit).toHaveBeenCalledWith(
          {
            name: "bookmarks.searchBookmarks.semantic",
            windowMs: 60_000,
            maxRequests: 300,
          },
          "127.0.0.1:user:user-123:bookmarks.searchBookmarks",
        );
      } finally {
        serverConfig.rateLimiting.enabled = wasRateLimitingEnabled;
      }
    },
  );

  test("does not apply the semantic search rate limit to full-text search", async () => {
    const next = vi.fn().mockResolvedValue("ok");
    const wasRateLimitingEnabled = serverConfig.rateLimiting.enabled;
    serverConfig.rateLimiting.enabled = true;

    try {
      const result = await createSemanticSearchRateLimitMiddleware<string>()({
        path: "bookmarks.searchBookmarks",
        ctx: {
          req: { ip: "127.0.0.1" },
          user: { id: "user-123" },
        },
        input: { searchMode: "fts" },
        next,
      });

      expect(result).toBe("ok");
      expect(searchMocks.getRateLimitClient).not.toHaveBeenCalled();
    } finally {
      serverConfig.rateLimiting.enabled = wasRateLimitingEnabled;
    }
  });

  test<CustomTestContext>("defaults to full-text search", async ({
    apiCallers,
  }) => {
    const bookmark = await apiCallers[0].bookmarks.createBookmark({
      type: BookmarkTypes.TEXT,
      text: "full text result",
    });
    searchMocks.search.mockResolvedValue({
      hits: [{ id: bookmark.id, score: 1 }],
      totalHits: 1,
      processingTimeMs: 1,
    });

    const result = await apiCallers[0].bookmarks.searchBookmarks({
      text: "result",
    });

    expect(result.bookmarks.map((item) => item.id)).toEqual([bookmark.id]);
    expect(searchMocks.vectorSearch).not.toHaveBeenCalled();
  });

  test<CustomTestContext>("fuses full-text and semantic rankings", async ({
    apiCallers,
  }) => {
    const [ftsOnly, shared, semanticOnly] = await Promise.all(
      ["full text", "shared", "semantic"].map((text) =>
        apiCallers[0].bookmarks.createBookmark({
          type: BookmarkTypes.TEXT,
          text,
        }),
      ),
    );
    searchMocks.search.mockResolvedValue({
      hits: [
        { id: ftsOnly.id, score: 1 },
        { id: shared.id, score: 0.5 },
      ],
      totalHits: 2,
      processingTimeMs: 1,
    });
    searchMocks.vectorSearch.mockResolvedValue({
      hits: [
        { id: semanticOnly.id, score: 0.95 },
        { id: shared.id, score: 0.9 },
      ],
      processingTimeMs: 1,
    });
    const generateEmbeddingFromText = mockEmbeddingInfra();

    const result = await apiCallers[0].bookmarks.searchBookmarks({
      text: "meaningful query",
      searchMode: "hybrid",
    });

    expect(result.bookmarks[0]?.id).toBe(shared.id);
    expect(new Set(result.bookmarks.slice(1).map((item) => item.id))).toEqual(
      new Set([ftsOnly.id, semanticOnly.id]),
    );
    expect(generateEmbeddingFromText).toHaveBeenCalledWith([
      "meaningful query",
    ]);
    expect(searchMocks.vectorSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        vector: [0.1, 0.2],
        limit: 100,
        filter: [
          {
            type: "eq",
            field: "userId",
            value: expect.any(String),
          },
        ],
      }),
    );
    expect(searchMocks.search).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 100 }),
    );
  });

  test<CustomTestContext>("falls back to full-text search when hybrid infrastructure is unavailable", async ({
    apiCallers,
  }) => {
    const bookmark = await apiCallers[0].bookmarks.createBookmark({
      type: BookmarkTypes.TEXT,
      text: "fallback result",
    });
    searchMocks.buildEmbeddingClient.mockReturnValue(null);
    searchMocks.getVectorStoreClient.mockResolvedValue(null);
    searchMocks.search.mockResolvedValue({
      hits: [{ id: bookmark.id, score: 1 }],
      totalHits: 1,
      processingTimeMs: 1,
    });

    const result = await apiCallers[0].bookmarks.searchBookmarks({
      text: "fallback",
      searchMode: "hybrid",
    });

    expect(result.bookmarks.map((item) => item.id)).toEqual([bookmark.id]);
    expect(searchMocks.vectorSearch).not.toHaveBeenCalled();
    expect(searchMocks.search).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 20, offset: 0 }),
    );
  });

  test<CustomTestContext>("falls back when the hybrid vector store fails to initialize", async ({
    apiCallers,
  }) => {
    const bookmark = await apiCallers[0].bookmarks.createBookmark({
      type: BookmarkTypes.TEXT,
      text: "vector initialization fallback",
    });
    mockEmbeddingInfra();
    searchMocks.getVectorStoreClient.mockRejectedValue(
      new Error("vector store unavailable"),
    );
    searchMocks.search.mockResolvedValue({
      hits: [{ id: bookmark.id, score: 1 }],
      totalHits: 1,
      processingTimeMs: 1,
    });

    const result = await apiCallers[0].bookmarks.searchBookmarks({
      text: "fallback",
      searchMode: "hybrid",
    });

    expect(result.bookmarks.map((item) => item.id)).toEqual([bookmark.id]);
    expect(searchMocks.search).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 20, offset: 0 }),
    );
  });

  test<CustomTestContext>("falls back to a correctly paginated full-text page when hybrid vector search fails", async ({
    apiCallers,
  }) => {
    const bookmark = await apiCallers[0].bookmarks.createBookmark({
      type: BookmarkTypes.TEXT,
      text: "runtime fallback",
    });
    mockEmbeddingInfra();
    searchMocks.vectorSearch.mockRejectedValue(
      new Error("vector query unavailable"),
    );
    searchMocks.search.mockResolvedValue({
      hits: [{ id: bookmark.id, score: 1 }],
      totalHits: 41,
      processingTimeMs: 1,
    });

    const result = await apiCallers[0].bookmarks.searchBookmarks({
      text: "fallback",
      searchMode: "hybrid",
      limit: 10,
      cursor: { ver: 1, offset: 40 },
    });

    expect(result.bookmarks.map((item) => item.id)).toEqual([bookmark.id]);
    expect(searchMocks.search).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ limit: 100 }),
    );
    expect(searchMocks.search).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ limit: 10, offset: 40 }),
    );
  });

  test<CustomTestContext>("falls back when hybrid embedding generation fails", async ({
    apiCallers,
  }) => {
    const bookmark = await apiCallers[0].bookmarks.createBookmark({
      type: BookmarkTypes.TEXT,
      text: "embedding fallback",
    });
    const generateEmbeddingFromText = mockEmbeddingInfra();
    generateEmbeddingFromText.mockRejectedValue(
      new Error("embedding provider unavailable"),
    );
    searchMocks.search.mockResolvedValue({
      hits: [{ id: bookmark.id, score: 1 }],
      totalHits: 1,
      processingTimeMs: 1,
    });

    const result = await apiCallers[0].bookmarks.searchBookmarks({
      text: "fallback",
      searchMode: "hybrid",
    });

    expect(result.bookmarks.map((item) => item.id)).toEqual([bookmark.id]);
    expect(searchMocks.search).toHaveBeenCalledTimes(2);
    expect(searchMocks.vectorSearch).not.toHaveBeenCalled();
  });

  test<CustomTestContext>("falls back to full-text search for filter-only hybrid queries", async ({
    apiCallers,
  }) => {
    const bookmark = await apiCallers[0].bookmarks.createBookmark({
      type: BookmarkTypes.TEXT,
      text: "favourited bookmark",
      favourited: true,
    });
    mockEmbeddingInfra();
    searchMocks.search.mockResolvedValue({
      hits: [{ id: bookmark.id, score: 1 }],
      totalHits: 1,
      processingTimeMs: 1,
    });

    // A filter-only query has nothing to embed, so hybrid degrades to full-text
    // search, which also means date sorting is allowed again.
    const result = await apiCallers[0].bookmarks.searchBookmarks({
      text: "is:fav",
      searchMode: "hybrid",
      sortOrder: "desc",
    });

    expect(result.bookmarks.map((item) => item.id)).toEqual([bookmark.id]);
    expect(searchMocks.vectorSearch).not.toHaveBeenCalled();
  });

  test<CustomTestContext>("rejects filter-only semantic queries", async ({
    apiCallers,
  }) => {
    mockEmbeddingInfra();

    await expect(
      apiCallers[0].bookmarks.searchBookmarks({
        text: "is:fav",
        searchMode: "semantic",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(searchMocks.vectorSearch).not.toHaveBeenCalled();
  });

  test<CustomTestContext>("rejects semantic search when its infrastructure is unavailable", async ({
    apiCallers,
  }) => {
    searchMocks.buildEmbeddingClient.mockReturnValue(null);
    searchMocks.getVectorStoreClient.mockResolvedValue(null);

    await expect(
      apiCallers[0].bookmarks.searchBookmarks({
        text: "semantic query",
        searchMode: "semantic",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  test<CustomTestContext>("preserves semantic search runtime failures", async ({
    apiCallers,
  }) => {
    mockEmbeddingInfra();
    searchMocks.vectorSearch.mockRejectedValue(
      new Error("vector query unavailable"),
    );

    await expect(
      apiCallers[0].bookmarks.searchBookmarks({
        text: "semantic query",
        searchMode: "semantic",
      }),
    ).rejects.toThrow("vector query unavailable");
    expect(searchMocks.search).not.toHaveBeenCalled();
  });

  test<CustomTestContext>("rejects date sorting for semantic and hybrid search", async ({
    apiCallers,
  }) => {
    mockEmbeddingInfra();

    await expect(
      apiCallers[0].bookmarks.searchBookmarks({
        text: "semantic query",
        searchMode: "hybrid",
        sortOrder: "desc",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  test<CustomTestContext>("drops semantic hits below the similarity threshold", async ({
    apiCallers,
  }) => {
    const bookmark = await apiCallers[0].bookmarks.createBookmark({
      type: BookmarkTypes.TEXT,
      text: "semantic result",
    });
    mockEmbeddingInfra();
    searchMocks.vectorSearch.mockResolvedValue({
      hits: [{ id: bookmark.id, score: 0.9 }],
      processingTimeMs: 1,
    });

    const result = await apiCallers[0].bookmarks.searchBookmarks({
      text: "meaningful query",
      searchMode: "semantic",
    });

    expect(result.bookmarks.map((item) => item.id)).toEqual([bookmark.id]);
    expect(searchMocks.vectorSearch).toHaveBeenCalledWith(
      expect.objectContaining({ rankingScoreThreshold: 0.6 }),
    );
    expect(searchMocks.search).not.toHaveBeenCalled();
  });
});

describe("bookmark search across shared lists", () => {
  interface SharedListFixture {
    listId: string;
    ownerBookmarkId: string;
    collaboratorBookmarkId: string;
    unrelatedBookmarkId: string;
    userIds: [string, string, string];
  }

  /**
   * Reproduces the setup from the bug report: user 1 creates "OurSharedList",
   * shares it with user 2, and both add a bookmark to it. User 3 shares nothing.
   *
   * Adding to a list requires editing it, which is why the collaborator is
   * shared in as an editor.
   */
  async function seedSharedList(
    apiCallers: APICallerType[],
  ): Promise<SharedListFixture> {
    const [ownerApi, collaboratorApi, unrelatedApi] = apiCallers;

    const { id: listId } = await ownerApi.lists.create({
      name: "OurSharedList",
      icon: "🤝",
      type: "manual",
    });

    const collaboratorEmail = (await collaboratorApi.users.whoami()).email!;
    const { invitationId } = await ownerApi.lists.addCollaborator({
      listId,
      email: collaboratorEmail,
      role: "editor",
    });
    await collaboratorApi.lists.acceptInvitation({ invitationId });

    const [ownerBookmark, collaboratorBookmark, unrelatedBookmark] =
      await Promise.all([
        ownerApi.bookmarks.createBookmark({
          type: BookmarkTypes.TEXT,
          text: "the owner's bookmark",
        }),
        collaboratorApi.bookmarks.createBookmark({
          type: BookmarkTypes.TEXT,
          text: "the collaborator's bookmark",
        }),
        unrelatedApi.bookmarks.createBookmark({
          type: BookmarkTypes.TEXT,
          text: "an unrelated user's bookmark",
        }),
      ]);

    // Each user adds their own bookmark to the shared list.
    await ownerApi.lists.addToList({ listId, bookmarkId: ownerBookmark.id });
    await collaboratorApi.lists.addToList({
      listId,
      bookmarkId: collaboratorBookmark.id,
    });

    const [ownerUser, collaboratorUser, unrelatedUser] = await Promise.all(
      apiCallers.map((api) => api.users.whoami()),
    );

    return {
      listId,
      ownerBookmarkId: ownerBookmark.id,
      collaboratorBookmarkId: collaboratorBookmark.id,
      unrelatedBookmarkId: unrelatedBookmark.id,
      userIds: [ownerUser.id, collaboratorUser.id, unrelatedUser.id],
    };
  }

  function indexed(fixture: SharedListFixture) {
    return [
      { id: fixture.ownerBookmarkId, userId: fixture.userIds[0] },
      { id: fixture.collaboratorBookmarkId, userId: fixture.userIds[1] },
      { id: fixture.unrelatedBookmarkId, userId: fixture.userIds[2] },
    ];
  }

  test<CustomTestContext>("returns the other user's bookmark to an editor of the shared list", async ({
    apiCallers,
  }) => {
    const fixture = await seedSharedList(apiCallers);
    mockIndexedBookmarks(indexed(fixture));

    const result = await apiCallers[1].bookmarks.searchBookmarks({
      text: "bookmark",
    });

    expect(new Set(result.bookmarks.map((b) => b.id))).toEqual(
      new Set([fixture.ownerBookmarkId, fixture.collaboratorBookmarkId]),
    );
  });

  test<CustomTestContext>("returns the other user's bookmark to a viewer of the shared list", async ({
    apiCallers,
  }) => {
    const [ownerApi, viewerApi] = apiCallers;
    const { id: listId } = await ownerApi.lists.create({
      name: "OurSharedList",
      icon: "🤝",
      type: "manual",
    });
    const viewerEmail = (await viewerApi.users.whoami()).email!;
    const { invitationId } = await ownerApi.lists.addCollaborator({
      listId,
      email: viewerEmail,
      role: "viewer",
    });
    await viewerApi.lists.acceptInvitation({ invitationId });

    const ownerBookmark = await ownerApi.bookmarks.createBookmark({
      type: BookmarkTypes.TEXT,
      text: "the owner's bookmark",
    });
    await ownerApi.lists.addToList({ listId, bookmarkId: ownerBookmark.id });

    const [ownerUser, viewerUser] = await Promise.all([
      ownerApi.users.whoami(),
      viewerApi.users.whoami(),
    ]);
    mockIndexedBookmarks([{ id: ownerBookmark.id, userId: ownerUser.id }]);

    const result = await viewerApi.bookmarks.searchBookmarks({
      text: "bookmark",
    });

    expect(result.bookmarks.map((b) => b.id)).toEqual([ownerBookmark.id]);
    expect(viewerUser.id).not.toBe(ownerUser.id);
  });

  test<CustomTestContext>("keeps owner-only search working", async ({
    apiCallers,
  }) => {
    const fixture = await seedSharedList(apiCallers);
    mockIndexedBookmarks(indexed(fixture));

    const result = await apiCallers[0].bookmarks.searchBookmarks({
      text: "bookmark",
    });

    expect(new Set(result.bookmarks.map((b) => b.id))).toEqual(
      new Set([fixture.ownerBookmarkId, fixture.collaboratorBookmarkId]),
    );
  });

  test<CustomTestContext>("never returns a bookmark of a user who shared nothing", async ({
    apiCallers,
  }) => {
    const fixture = await seedSharedList(apiCallers);
    mockIndexedBookmarks(indexed(fixture));

    const result = await apiCallers[0].bookmarks.searchBookmarks({
      text: "bookmark",
    });

    expect(result.bookmarks.map((b) => b.id)).not.toContain(
      fixture.unrelatedBookmarkId,
    );
  });

  test<CustomTestContext>("rejects unauthorized hits returned by the search backend", async ({
    apiCallers,
  }) => {
    const fixture = await seedSharedList(apiCallers);
    searchMocks.search.mockResolvedValue({
      hits: [
        { id: fixture.ownerBookmarkId, score: 1 },
        { id: fixture.unrelatedBookmarkId, score: 0.9 },
      ],
      totalHits: 2,
      processingTimeMs: 1,
    });

    const result = await apiCallers[1].bookmarks.searchBookmarks({
      text: "bookmark",
    });

    expect(result.bookmarks.map((b) => b.id)).toEqual([
      fixture.ownerBookmarkId,
    ]);
  });

  test<CustomTestContext>('resolves list:"OurSharedList" for the collaborator', async ({
    apiCallers,
  }) => {
    const fixture = await seedSharedList(apiCallers);
    mockIndexedBookmarks(indexed(fixture));

    const result = await apiCallers[1].bookmarks.searchBookmarks({
      text: 'list:"OurSharedList"',
    });

    expect(new Set(result.bookmarks.map((b) => b.id))).toEqual(
      new Set([fixture.ownerBookmarkId, fixture.collaboratorBookmarkId]),
    );
  });

  test<CustomTestContext>("does not resolve a list the caller has no access to", async ({
    apiCallers,
  }) => {
    const fixture = await seedSharedList(apiCallers);
    mockIndexedBookmarks(indexed(fixture));

    const result = await apiCallers[2].bookmarks.searchBookmarks({
      text: 'list:"OurSharedList"',
    });

    expect(result.bookmarks).toEqual([]);
  });

  test<CustomTestContext>("stops returning a shared bookmark once the invitation is revoked", async ({
    apiCallers,
  }) => {
    const fixture = await seedSharedList(apiCallers);
    mockIndexedBookmarks(indexed(fixture));

    const collaboratorUser = await apiCallers[1].users.whoami();
    await apiCallers[0].lists.removeCollaborator({
      listId: fixture.listId,
      userId: collaboratorUser.id,
    });

    const result = await apiCallers[1].bookmarks.searchBookmarks({
      text: "bookmark",
    });

    expect(result.bookmarks.map((b) => b.id)).toEqual([
      fixture.collaboratorBookmarkId,
    ]);
  });

  test<CustomTestContext>("does not return a shared bookmark while the invitation is pending", async ({
    apiCallers,
  }) => {
    const [ownerApi, collaboratorApi] = apiCallers;
    const { id: listId } = await ownerApi.lists.create({
      name: "OurSharedList",
      icon: "🤝",
      type: "manual",
    });
    const collaboratorEmail = (await collaboratorApi.users.whoami()).email!;
    await ownerApi.lists.addCollaborator({
      listId,
      email: collaboratorEmail,
      role: "viewer",
    });

    const ownerBookmark = await ownerApi.bookmarks.createBookmark({
      type: BookmarkTypes.TEXT,
      text: "the owner's bookmark",
    });
    await ownerApi.lists.addToList({ listId, bookmarkId: ownerBookmark.id });

    mockIndexedBookmarks([
      {
        id: ownerBookmark.id,
        userId: (await apiCallers[0].users.whoami()).id,
      },
    ]);

    const result = await collaboratorApi.bookmarks.searchBookmarks({
      text: "bookmark",
    });

    expect(result.bookmarks).toEqual([]);
  });

  test<CustomTestContext>("paginates shared results across pages", async ({
    apiCallers,
  }) => {
    const [ownerApi, collaboratorApi] = apiCallers;
    const ownerUserId = (await ownerApi.users.whoami()).id;
    const { id: listId } = await ownerApi.lists.create({
      name: "OurSharedList",
      icon: "🤝",
      type: "manual",
    });
    const collaboratorEmail = (await collaboratorApi.users.whoami()).email!;
    const { invitationId } = await ownerApi.lists.addCollaborator({
      listId,
      email: collaboratorEmail,
      role: "viewer",
    });
    await collaboratorApi.lists.acceptInvitation({ invitationId });

    const ownerBookmarks = [];
    for (let i = 0; i < 3; i++) {
      const b = await ownerApi.bookmarks.createBookmark({
        type: BookmarkTypes.TEXT,
        text: `owner bookmark ${i}`,
      });
      await ownerApi.lists.addToList({ listId, bookmarkId: b.id });
      ownerBookmarks.push(b);
    }

    // Only the first page of the index is requested; the shared ids must reach
    // the filter so the collaborator sees all of them across pages.
    const docs = ownerBookmarks.map((b) => ({
      id: b.id,
      userId: ownerUserId,
    }));
    mockIndexedBookmarks(docs);

    const firstPage = await collaboratorApi.bookmarks.searchBookmarks({
      text: "bookmark",
      limit: 2,
    });
    expect(firstPage.bookmarks.length).toBe(2);
    expect(firstPage.nextCursor).toBeDefined();

    const secondPage = await collaboratorApi.bookmarks.searchBookmarks({
      text: "bookmark",
      limit: 2,
      cursor: firstPage.nextCursor!,
    });
    expect(secondPage.bookmarks.map((b) => b.id)).toEqual([
      ownerBookmarks[2].id,
    ]);
    expect(secondPage.nextCursor).toBeNull();
  });

  test<CustomTestContext>("passes the widened filter to semantic search", async ({
    apiCallers,
  }) => {
    const fixture = await seedSharedList(apiCallers);
    mockEmbeddingInfra();
    searchMocks.vectorSearch.mockResolvedValue({
      hits: [
        { id: fixture.ownerBookmarkId, score: 0.9 },
        { id: fixture.collaboratorBookmarkId, score: 0.8 },
      ],
      processingTimeMs: 1,
    });

    const result = await apiCallers[1].bookmarks.searchBookmarks({
      text: "meaningful query",
      searchMode: "semantic",
    });

    expect(new Set(result.bookmarks.map((b) => b.id))).toEqual(
      new Set([fixture.ownerBookmarkId, fixture.collaboratorBookmarkId]),
    );
    expect(searchMocks.vectorSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: [
          {
            type: "or",
            filters: [
              { type: "eq", field: "userId", value: fixture.userIds[1] },
              { type: "in", field: "id", values: [fixture.ownerBookmarkId] },
            ],
          },
        ],
      }),
    );
  });
});
