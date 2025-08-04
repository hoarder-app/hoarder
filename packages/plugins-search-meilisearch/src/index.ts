import type { Index } from "meilisearch";
import { MeiliSearch } from "meilisearch";

import type {
  BookmarkSearchDocument,
  SearchIndexClient,
  SearchOptions,
  SearchResponse,
} from "@karakeep/shared/search";
import { PluginProvider } from "@karakeep/shared/plugins";

import { envConfig } from "./env";

class MeiliSearchIndexClient implements SearchIndexClient {
  constructor(private index: Index<BookmarkSearchDocument>) {}

  async addDocuments(documents: BookmarkSearchDocument[]): Promise<void> {
    const task = await this.index.addDocuments(documents, {
      primaryKey: "id",
    });
    await this.index.waitForTask(task.taskUid);
    const taskResult = await this.index.getTask(task.taskUid);
    if (taskResult.error) {
      throw new Error(
        `MeiliSearch add documents failed: ${taskResult.error.message}`,
      );
    }
  }

  async updateDocuments(documents: BookmarkSearchDocument[]): Promise<void> {
    const task = await this.index.updateDocuments(documents, {
      primaryKey: "id",
    });
    await this.index.waitForTask(task.taskUid);
    const taskResult = await this.index.getTask(task.taskUid);
    if (taskResult.error) {
      throw new Error(
        `MeiliSearch update documents failed: ${taskResult.error.message}`,
      );
    }
  }

  async deleteDocument(id: string): Promise<void> {
    const task = await this.index.deleteDocument(id);
    await this.index.waitForTask(task.taskUid);
    const taskResult = await this.index.getTask(task.taskUid);
    if (taskResult.error) {
      throw new Error(
        `MeiliSearch delete document failed: ${taskResult.error.message}`,
      );
    }
  }

  async deleteDocuments(ids: string[]): Promise<void> {
    const task = await this.index.deleteDocuments(ids);
    await this.index.waitForTask(task.taskUid);
    const taskResult = await this.index.getTask(task.taskUid);
    if (taskResult.error) {
      throw new Error(
        `MeiliSearch delete documents failed: ${taskResult.error.message}`,
      );
    }
  }

  async search(options: SearchOptions): Promise<SearchResponse> {
    const result = await this.index.search(options.query, {
      filter: options.filter,
      limit: options.limit,
      offset: options.offset,
      sort: options.sort,
    });

    return {
      hits: result.hits.map((hit) => ({
        id: hit.id,
        score: hit._rankingScore,
      })),
      totalHits: result.estimatedTotalHits ?? 0,
      processingTimeMs: result.processingTimeMs,
    };
  }

  async clearIndex(): Promise<void> {
    const task = await this.index.deleteAllDocuments();
    await this.index.waitForTask(task.taskUid);
    const taskResult = await this.index.getTask(task.taskUid);
    if (taskResult.error) {
      throw new Error(
        `MeiliSearch clear index failed: ${taskResult.error.message}`,
      );
    }
  }
}

export class MeiliSearchProvider implements PluginProvider<SearchIndexClient> {
  private client: MeiliSearch | undefined;
  private indexClient: SearchIndexClient | undefined;
  private readonly indexName = "bookmarks";

  constructor() {
    if (MeiliSearchProvider.isConfigured()) {
      this.client = new MeiliSearch({
        host: envConfig.MEILI_ADDR!,
        apiKey: envConfig.MEILI_MASTER_KEY,
      });
    }
  }

  static isConfigured(): boolean {
    return !!envConfig.MEILI_ADDR;
  }

  async getClient(): Promise<SearchIndexClient | null> {
    if (this.indexClient) {
      return this.indexClient;
    }

    if (!this.client) {
      return null;
    }

    const indices = await this.client.getIndexes();
    let indexFound = indices.results.find((i) => i.uid === this.indexName);

    if (!indexFound) {
      const idx = await this.client.createIndex(this.indexName, {
        primaryKey: "id",
      });
      await this.client.waitForTask(idx.taskUid);
      indexFound = await this.client.getIndex<BookmarkSearchDocument>(
        this.indexName,
      );
    }

    await this.configureIndex(indexFound);
    this.indexClient = new MeiliSearchIndexClient(indexFound);
    return this.indexClient;
  }

  private async configureIndex(
    index: Index<BookmarkSearchDocument>,
  ): Promise<void> {
    const desiredFilterableAttributes = ["id", "userId"].sort();
    const desiredSortableAttributes = ["createdAt"].sort();

    const settings = await index.getSettings();

    if (
      JSON.stringify(settings.filterableAttributes?.sort()) !==
      JSON.stringify(desiredFilterableAttributes)
    ) {
      console.log(
        `[meilisearch] Updating desired filterable attributes to ${desiredFilterableAttributes} from ${settings.filterableAttributes}`,
      );
      const taskId = await index.updateFilterableAttributes(
        desiredFilterableAttributes,
      );
      await this.client!.waitForTask(taskId.taskUid);
    }

    if (
      JSON.stringify(settings.sortableAttributes?.sort()) !==
      JSON.stringify(desiredSortableAttributes)
    ) {
      console.log(
        `[meilisearch] Updating desired sortable attributes to ${desiredSortableAttributes} from ${settings.sortableAttributes}`,
      );
      const taskId = await index.updateSortableAttributes(
        desiredSortableAttributes,
      );
      await this.client!.waitForTask(taskId.taskUid);
    }
  }
}
