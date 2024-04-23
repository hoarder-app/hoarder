import type { Job } from "bullmq";
import { Worker } from "bullmq";
import { eq } from "drizzle-orm";

import type { ZSearchIndexingRequest } from "@hoarder/shared/queues";
import { db } from "@hoarder/db";
import { bookmarks } from "@hoarder/db/schema";
import logger from "@hoarder/shared/logger";
import {
  queueConnectionDetails,
  SearchIndexingQueue,
  zSearchIndexingRequestSchema,
} from "@hoarder/shared/queues";
import { getSearchIdxClient } from "@hoarder/shared/search";

export class SearchIndexingWorker {
  static build() {
    logger.info("Starting search indexing worker ...");
    const worker = new Worker<ZSearchIndexingRequest, void>(
      SearchIndexingQueue.name,
      runSearchIndexing,
      {
        connection: queueConnectionDetails,
        autorun: false,
      },
    );

    worker.on("completed", (job) => {
      const jobId = job?.id ?? "unknown";
      logger.info(`[search][${jobId}] Completed successfully`);
    });

    worker.on("failed", (job, error) => {
      const jobId = job?.id ?? "unknown";
      logger.error(`[search][${jobId}] search job failed: ${error}`);
    });

    return worker;
  }
}

async function ensureTaskSuccess(
  searchClient: NonNullable<Awaited<ReturnType<typeof getSearchIdxClient>>>,
  taskUid: number,
) {
  const task = await searchClient.waitForTask(taskUid);
  if (task.error) {
    throw new Error(`Search task failed: ${task.error.message}`);
  }
}

async function runIndex(
  searchClient: NonNullable<Awaited<ReturnType<typeof getSearchIdxClient>>>,
  bookmarkId: string,
) {
  const bookmark = await db.query.bookmarks.findFirst({
    where: eq(bookmarks.id, bookmarkId),
    with: {
      link: true,
      text: true,
      asset: true,
      tagsOnBookmarks: {
        with: {
          tag: true,
        },
      },
    },
  });

  if (!bookmark) {
    throw new Error(`Bookmark ${bookmarkId} not found`);
  }

  const task = await searchClient.addDocuments(
    [
      {
        id: bookmark.id,
        userId: bookmark.userId,
        ...(bookmark.link
          ? {
              url: bookmark.link.url,
              linkTitle: bookmark.link.title,
              description: bookmark.link.description,
              content: bookmark.link.content,
            }
          : undefined),
        ...(bookmark.asset
          ? {
              content: bookmark.asset.content,
              metadata: bookmark.asset.metadata,
            }
          : undefined),
        ...(bookmark.text ? { content: bookmark.text.text } : undefined),
        note: bookmark.note,
        title: bookmark.title,
        createdAt: bookmark.createdAt.toISOString(),
        tags: bookmark.tagsOnBookmarks.map((t) => t.tag.name),
      },
    ],
    {
      primaryKey: "id",
    },
  );
  await ensureTaskSuccess(searchClient, task.taskUid);
}

async function runDelete(
  searchClient: NonNullable<Awaited<ReturnType<typeof getSearchIdxClient>>>,
  bookmarkId: string,
) {
  const task = await searchClient.deleteDocument(bookmarkId);
  await ensureTaskSuccess(searchClient, task.taskUid);
}

async function runSearchIndexing(job: Job<ZSearchIndexingRequest, void>) {
  const jobId = job.id ?? "unknown";

  const request = zSearchIndexingRequestSchema.safeParse(job.data);
  if (!request.success) {
    throw new Error(
      `[search][${jobId}] Got malformed job request: ${request.error.toString()}`,
    );
  }

  const searchClient = await getSearchIdxClient();
  if (!searchClient) {
    logger.debug(
      `[search][${jobId}] Search is not configured, nothing to do now`,
    );
    return;
  }

  const bookmarkId = request.data.bookmarkId;
  logger.info(
    `[search][${jobId}] Attempting to index bookmark with id ${bookmarkId} ...`,
  );

  switch (request.data.type) {
    case "index": {
      await runIndex(searchClient, bookmarkId);
      break;
    }
    case "delete": {
      await runDelete(searchClient, bookmarkId);
      break;
    }
  }
}
