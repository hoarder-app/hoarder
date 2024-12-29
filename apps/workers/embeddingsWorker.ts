import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { eq } from "drizzle-orm";
import { DequeuedJob, Runner } from "liteque";

import type { EmbeddingsRequest, ZOpenAIRequest } from "@hoarder/shared/queues";
import { db } from "@hoarder/db";
import { bookmarkEmbeddings, bookmarks } from "@hoarder/db/schema";
import serverConfig from "@hoarder/shared/config";
import { InferenceClientFactory } from "@hoarder/shared/inference";
import logger from "@hoarder/shared/logger";
import {
  EmbeddingsQueue,
  zEmbeddingsRequestSchema,
} from "@hoarder/shared/queues";
import { getBookmarkVectorDb } from "@hoarder/shared/vectorDb";

type EmbeddingChunk = Pick<
  typeof bookmarkEmbeddings.$inferSelect,
  "embeddingType" | "fromOffset" | "toOffset"
> & { text: string };

export class EmbeddingsWorker {
  static build() {
    logger.info("Starting embeddings worker ...");
    const worker = new Runner<ZOpenAIRequest>(
      EmbeddingsQueue,
      {
        run: runEmbeddings,
        onComplete: async (job) => {
          const jobId = job.id;
          logger.info(`[embeddings][${jobId}] Completed successfully`);
          return Promise.resolve();
        },
        onError: async (job) => {
          const jobId = job.id;
          logger.error(
            `[embeddings][${jobId}] embeddings job failed: ${job.error}\n${job.error.stack}`,
          );
          return Promise.resolve();
        },
      },
      {
        concurrency: 1,
        pollIntervalMs: 1000,
        timeoutSecs: serverConfig.inference.jobTimeoutSec,
        validator: zEmbeddingsRequestSchema,
      },
    );

    return worker;
  }
}

async function fetchBookmark(linkId: string) {
  return await db.query.bookmarks.findFirst({
    where: eq(bookmarks.id, linkId),
    with: {
      link: true,
      text: true,
      asset: true,
    },
  });
}

async function chunkText(text: string): Promise<EmbeddingChunk[]> {
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 100,
    chunkOverlap: 0,
  });
  const texts = await textSplitter.splitText(text);
  return texts.map((t) => ({
    embeddingType: "content_chunk",
    text: t,
    fromOffset: 0,
    toOffset: t.length,
  }));
}

async function prepareEmbeddings(
  bookmark: NonNullable<Awaited<ReturnType<typeof fetchBookmark>>>,
) {
  const reqs: EmbeddingChunk[] = [];

  if (bookmark.link) {
    if (bookmark.link.description) {
      reqs.push({
        embeddingType: "description",
        fromOffset: 0,
        toOffset: bookmark.link.description?.length ?? 0,
        text: bookmark.link.description ?? "",
      });
    }
    if (bookmark.link.content) {
      reqs.push({
        embeddingType: "content_full",
        fromOffset: 0,
        toOffset: bookmark.link.content?.length ?? 0,
        text: bookmark.link.content ?? "",
      });
      reqs.push(...(await chunkText(bookmark.link.content ?? "")));
    }
  }

  if (bookmark.text) {
    if (bookmark.text.text) {
      reqs.push({
        embeddingType: "description",
        fromOffset: 0,
        toOffset: bookmark.text.text?.length ?? 0,
        text: bookmark.text.text ?? "",
      });
      reqs.push(...(await chunkText(bookmark.text.text)));
    }
  }

  if (bookmark.asset) {
    if (bookmark.asset.content) {
      reqs.push({
        embeddingType: "content_full",
        fromOffset: 0,
        toOffset: bookmark.asset.content?.length ?? 0,
        text: bookmark.asset.content ?? "",
      });
      reqs.push(...(await chunkText(bookmark.asset.content)));
    }
  }
  return reqs;
}

async function runEmbeddings(job: DequeuedJob<EmbeddingsRequest>) {
  const jobId = job.id;

  const inferenceClient = InferenceClientFactory.build();
  if (!inferenceClient) {
    logger.debug(
      `[embeddings][${jobId}] No inference client configured, nothing to do now`,
    );
    return;
  }

  const { bookmarkId } = job.data;
  const bookmark = await fetchBookmark(bookmarkId);
  if (!bookmark) {
    throw new Error(
      `[embeddings][${jobId}] bookmark with id ${bookmarkId} was not found`,
    );
  }

  logger.info(
    `[embeddings][${jobId}] Starting an embeddings job for bookmark with id "${bookmark.id}"`,
  );

  const reqs = await prepareEmbeddings(bookmark);

  logger.info(`[embeddings][${jobId}] Got ${reqs.length} embeddings requests`);
  if (reqs.length == 0) {
    logger.info(`[embeddings][${jobId}] No embeddings requests to process`);
    return;
  }

  const embeddings = await inferenceClient.generateEmbeddingFromText(
    reqs.map((r) => r.text),
  );

  const resps = reqs.map((req, i) => ({
    ...req,
    embedding: embeddings.embeddings[i],
  }));

  const db = await getBookmarkVectorDb();
  // Delete the old vectors
  await db.delete(`bookmarkid = "${bookmark.id}"`);
  // Add the new vectors
  await db.add(
    resps.map((r) => ({
      vector: r.embedding,
      bookmarkid: bookmarkId,
    })),
  );
}
