import { and, eq } from "drizzle-orm";
import { DequeuedJob } from "liteque";

import { db } from "@karakeep/db";
import { bookmarks, customPrompts } from "@karakeep/db/schema";
import serverConfig from "@karakeep/shared/config";
import { InferenceClient } from "@karakeep/shared/inference";
import logger from "@karakeep/shared/logger";
import { buildSummaryPrompt } from "@karakeep/shared/prompts";
import { triggerSearchReindex, ZOpenAIRequest } from "@karakeep/shared/queues";
import { BookmarkTypes } from "@karakeep/shared/types/bookmarks";

async function fetchBookmarkDetailsForSummary(bookmarkId: string) {
  const bookmark = await db.query.bookmarks.findFirst({
    where: eq(bookmarks.id, bookmarkId),
    columns: { id: true, userId: true, type: true },
    with: {
      link: {
        columns: {
          title: true,
          description: true,
          content: true,
          publisher: true,
          author: true,
          url: true,
        },
      },
      // If assets (like PDFs with extracted text) should be summarized, extend here
    },
  });

  if (!bookmark) {
    throw new Error(`Bookmark with id ${bookmarkId} not found`);
  }
  return bookmark;
}

export async function runSummarization(
  bookmarkId: string,
  job: DequeuedJob<ZOpenAIRequest>,
  inferenceClient: InferenceClient,
) {
  if (!serverConfig.inference.enableAutoSummarization) {
    logger.info(
      `[inference][${job.id}] Skipping summarization job for bookmark with id "${bookmarkId}" because it's disabled in the config.`,
    );
    return;
  }
  const jobId = job.id;

  logger.info(
    `[inference][${jobId}] Starting a summary job for bookmark with id "${bookmarkId}"`,
  );

  const bookmarkData = await fetchBookmarkDetailsForSummary(bookmarkId);

  let textToSummarize = "";
  if (bookmarkData.type === BookmarkTypes.LINK && bookmarkData.link) {
    const link = bookmarkData.link;
    textToSummarize = `
Title: ${link.title ?? ""}
Description: ${link.description ?? ""}
Content: ${link.content ?? ""}
Publisher: ${link.publisher ?? ""}
Author: ${link.author ?? ""}
URL: ${link.url ?? ""}
`;
  } else {
    logger.warn(
      `[inference][${jobId}] Bookmark ${bookmarkId} (type: ${bookmarkData.type}) is not a LINK or TEXT type with content, or content is missing. Skipping summary.`,
    );
    return;
  }

  if (!textToSummarize.trim()) {
    logger.info(
      `[inference][${jobId}] No content to summarize for bookmark ${bookmarkId}.`,
    );
    return;
  }

  const prompts = await db.query.customPrompts.findMany({
    where: and(
      eq(customPrompts.userId, bookmarkData.userId),
      eq(customPrompts.appliesTo, "summary"),
    ),
    columns: {
      text: true,
    },
  });

  const summaryPrompt = buildSummaryPrompt(
    serverConfig.inference.inferredTagLang,
    prompts.map((p) => p.text),
    textToSummarize,
    serverConfig.inference.contextLength,
  );

  const summaryResult = await inferenceClient.inferFromText(summaryPrompt, {
    schema: null, // Summaries are typically free-form text
    abortSignal: job.abortSignal,
  });

  if (!summaryResult.response) {
    throw new Error(
      `[inference][${jobId}] Failed to summarize bookmark ${bookmarkId}, empty response from inference client.`,
    );
  }

  logger.info(
    `[inference][${jobId}] Generated summary for bookmark "${bookmarkId}" using ${summaryResult.totalTokens} tokens.`,
  );

  await db
    .update(bookmarks)
    .set({
      summary: summaryResult.response,
      modifiedAt: new Date(),
    })
    .where(eq(bookmarks.id, bookmarkId));

  await triggerSearchReindex(bookmarkId);
}
