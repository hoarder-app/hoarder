import path from "node:path";
import { buildDBClient, migrateDB, SqliteQueue } from "liteque";
import { z } from "zod";

import serverConfig from "./config";

const QUEUE_DB_PATH = path.join(serverConfig.dataDir, "queue.db");

const queueDB = buildDBClient(QUEUE_DB_PATH);

export function runQueueDBMigrations() {
  migrateDB(queueDB);
}

// Link Crawler
export const zCrawlLinkRequestSchema = z.object({
  bookmarkId: z.string(),
  runInference: z.boolean().optional(),
  archiveFullPage: z.boolean().optional().default(false),
});
export type ZCrawlLinkRequest = z.input<typeof zCrawlLinkRequestSchema>;

export const LinkCrawlerQueue = new SqliteQueue<ZCrawlLinkRequest>(
  "link_crawler_queue",
  queueDB,
  {
    defaultJobArgs: {
      numRetries: 5,
    },
  },
);

// OpenAI Worker
export const zOpenAIRequestSchema = z.object({
  bookmarkId: z.string(),
});
export type ZOpenAIRequest = z.infer<typeof zOpenAIRequestSchema>;

export const OpenAIQueue = new SqliteQueue<ZOpenAIRequest>(
  "openai_queue",
  queueDB,
  {
    defaultJobArgs: {
      numRetries: 3,
    },
  },
);

// Search Indexing Worker
export const zSearchIndexingRequestSchema = z.object({
  bookmarkId: z.string(),
  type: z.enum(["index", "delete"]),
});
export type ZSearchIndexingRequest = z.infer<
  typeof zSearchIndexingRequestSchema
>;
export const SearchIndexingQueue = new SqliteQueue<ZSearchIndexingRequest>(
  "searching_indexing",
  queueDB,
  {
    defaultJobArgs: {
      numRetries: 5,
    },
  },
);

// Tidy Assets Worker
export const zTidyAssetsRequestSchema = z.object({
  cleanDanglingAssets: z.boolean().optional().default(false),
  syncAssetMetadata: z.boolean().optional().default(false),
});
export type ZTidyAssetsRequest = z.infer<typeof zTidyAssetsRequestSchema>;
export const TidyAssetsQueue = new SqliteQueue<ZTidyAssetsRequest>(
  "tidy_assets_queue",
  queueDB,
  {
    defaultJobArgs: {
      numRetries: 1,
    },
  },
);

export async function triggerSearchReindex(bookmarkId: string) {
  await SearchIndexingQueue.enqueue({
    bookmarkId,
    type: "index",
  });
}

export async function triggerSearchDeletion(bookmarkId: string) {
  await SearchIndexingQueue.enqueue({
    bookmarkId: bookmarkId,
    type: "delete",
  });
}

export const zvideoRequestSchema = z.object({
  bookmarkId: z.string(),
  url: z.string(),
});
export type ZVideoRequest = z.infer<typeof zvideoRequestSchema>;

export const VideoWorkerQueue = new SqliteQueue<ZVideoRequest>(
  "video_queue",
  queueDB,
  {
    defaultJobArgs: {
      numRetries: 5,
    },
  },
);

export async function triggerVideoWorker(bookmarkId: string, url: string) {
  await VideoWorkerQueue.enqueue({
    bookmarkId,
    url,
  });
}
