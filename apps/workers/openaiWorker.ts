import { and, Column, eq, inArray, sql } from "drizzle-orm";
import { DequeuedJob, Runner } from "liteque";
import { z } from "zod";

import type { InferenceClient } from "@hoarder/shared/inference";
import type { ZOpenAIRequest } from "@hoarder/shared/queues";
import { db } from "@hoarder/db";
import {
  bookmarkAssets,
  bookmarks,
  bookmarkTags,
  customPrompts,
  tagsOnBookmarks,
} from "@hoarder/db/schema";
import { readAsset } from "@hoarder/shared/assetdb";
import serverConfig from "@hoarder/shared/config";
import { InferenceClientFactory } from "@hoarder/shared/inference";
import logger from "@hoarder/shared/logger";
import { buildImagePrompt, buildTextPrompt } from "@hoarder/shared/prompts";
import {
  OpenAIQueue,
  triggerSearchReindex,
  zOpenAIRequestSchema,
} from "@hoarder/shared/queues";

import { readImageText, readPDFText } from "./utils";

const openAIResponseSchema = z.object({
  tags: z.array(z.string()),
});

function tagNormalizer(col: Column) {
  function normalizeTag(tag: string) {
    return tag.toLowerCase().replace(/[ \-_]/g, "");
  }

  return {
    normalizeTag,
    sql: sql`lower(replace(replace(replace(${col}, ' ', ''), '-', ''), '_', ''))`,
  };
}

async function attemptMarkTaggingStatus(
  jobData: object | undefined,
  status: "success" | "failure",
) {
  if (!jobData) {
    return;
  }
  try {
    const request = zOpenAIRequestSchema.parse(jobData);
    await db
      .update(bookmarks)
      .set({
        taggingStatus: status,
      })
      .where(eq(bookmarks.id, request.bookmarkId));
  } catch (e) {
    logger.error(`Something went wrong when marking the tagging status: ${e}`);
  }
}

export class OpenAiWorker {
  static build() {
    logger.info("Starting inference worker ...");
    const worker = new Runner<ZOpenAIRequest>(
      OpenAIQueue,
      {
        run: runOpenAI,
        onComplete: async (job) => {
          const jobId = job.id;
          logger.info(`[inference][${jobId}] Completed successfully`);
          await attemptMarkTaggingStatus(job.data, "success");
        },
        onError: async (job) => {
          const jobId = job.id;
          logger.error(
            `[inference][${jobId}] inference job failed: ${job.error}\n${job.error.stack}`,
          );
          if (job.numRetriesLeft == 0) {
            await attemptMarkTaggingStatus(job?.data, "failure");
          }
        },
      },
      {
        concurrency: 1,
        pollIntervalMs: 1000,
        timeoutSecs: serverConfig.inference.jobTimeoutSec,
      },
    );

    return worker;
  }
}

async function buildPrompt(
  bookmark: NonNullable<Awaited<ReturnType<typeof fetchBookmark>>>,
) {
  const prompts = await fetchCustomPrompts(bookmark.userId, "text");
  if (bookmark.link) {
    if (!bookmark.link.description && !bookmark.link.content) {
      throw new Error(
        `No content found for link "${bookmark.id}". Skipping ...`,
      );
    }

    const content = bookmark.link.content;
    return buildTextPrompt(
      serverConfig.inference.inferredTagLang,
      prompts,
      `URL: ${bookmark.link.url}
Title: ${bookmark.link.title ?? ""}
Description: ${bookmark.link.description ?? ""}
Content: ${content ?? ""}`,
      serverConfig.inference.contextLength,
    );
  }

  if (bookmark.text) {
    return buildTextPrompt(
      serverConfig.inference.inferredTagLang,
      prompts,
      bookmark.text.text ?? "",
      serverConfig.inference.contextLength,
    );
  }

  throw new Error("Unknown bookmark type");
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

async function inferTagsFromImage(
  jobId: string,
  bookmark: NonNullable<Awaited<ReturnType<typeof fetchBookmark>>>,
  inferenceClient: InferenceClient,
) {
  const { asset, metadata } = await readAsset({
    userId: bookmark.userId,
    assetId: bookmark.asset.assetId,
  });

  if (!asset) {
    throw new Error(
      `[inference][${jobId}] AssetId ${bookmark.asset.assetId} for bookmark ${bookmark.id} not found`,
    );
  }

  let imageText = null;
  try {
    imageText = await readImageText(asset);
  } catch (e) {
    logger.error(`[inference][${jobId}] Failed to read image text: ${e}`);
  }

  if (imageText) {
    logger.info(
      `[inference][${jobId}] Extracted ${imageText.length} characters from image.`,
    );
    await db
      .update(bookmarkAssets)
      .set({
        content: imageText,
      })
      .where(eq(bookmarkAssets.id, bookmark.id));
  }

  const base64 = asset.toString("base64");
  return inferenceClient.inferFromImage(
    buildImagePrompt(
      serverConfig.inference.inferredTagLang,
      await fetchCustomPrompts(bookmark.userId, "images"),
    ),
    metadata.contentType,
    base64,
    { json: true },
  );
}

async function fetchCustomPrompts(
  userId: string,
  appliesTo: "text" | "images",
) {
  const prompts = await db.query.customPrompts.findMany({
    where: and(
      eq(customPrompts.userId, userId),
      inArray(customPrompts.appliesTo, ["all", appliesTo]),
    ),
    columns: {
      text: true,
    },
  });

  return prompts.map((p) => p.text);
}

async function inferTagsFromPDF(
  jobId: string,
  bookmark: NonNullable<Awaited<ReturnType<typeof fetchBookmark>>>,
  inferenceClient: InferenceClient,
) {
  const { asset } = await readAsset({
    userId: bookmark.userId,
    assetId: bookmark.asset.assetId,
  });
  if (!asset) {
    throw new Error(
      `[inference][${jobId}] AssetId ${bookmark.asset.assetId} for bookmark ${bookmark.id} not found`,
    );
  }
  const pdfParse = await readPDFText(asset);
  if (!pdfParse?.text) {
    throw new Error(
      `[inference][${jobId}] PDF text is empty. Please make sure that the PDF includes text and not just images.`,
    );
  }

  await db
    .update(bookmarkAssets)
    .set({
      content: pdfParse.text,
      metadata: pdfParse.metadata ? JSON.stringify(pdfParse.metadata) : null,
    })
    .where(eq(bookmarkAssets.id, bookmark.id));

  const prompt = buildTextPrompt(
    serverConfig.inference.inferredTagLang,
    await fetchCustomPrompts(bookmark.userId, "text"),
    `Content: ${pdfParse.text}`,
    serverConfig.inference.contextLength,
  );
  return inferenceClient.inferFromText(prompt, { json: true });
}

async function inferTagsFromText(
  bookmark: NonNullable<Awaited<ReturnType<typeof fetchBookmark>>>,
  inferenceClient: InferenceClient,
) {
  return await inferenceClient.inferFromText(await buildPrompt(bookmark), {
    json: true,
  });
}

async function inferTags(
  jobId: string,
  bookmark: NonNullable<Awaited<ReturnType<typeof fetchBookmark>>>,
  inferenceClient: InferenceClient,
) {
  let response;
  if (bookmark.link || bookmark.text) {
    response = await inferTagsFromText(bookmark, inferenceClient);
  } else if (bookmark.asset) {
    switch (bookmark.asset.assetType) {
      case "image":
        response = await inferTagsFromImage(jobId, bookmark, inferenceClient);
        break;
      case "pdf":
        response = await inferTagsFromPDF(jobId, bookmark, inferenceClient);
        break;
      default:
        throw new Error(`[inference][${jobId}] Unsupported bookmark type`);
    }
  } else {
    throw new Error(`[inference][${jobId}] Unsupported bookmark type`);
  }

  if (!response) {
    throw new Error(`[inference][${jobId}] Inference response is empty`);
  }

  try {
    let tags = openAIResponseSchema.parse(JSON.parse(response.response)).tags;
    logger.info(
      `[inference][${jobId}] Inferring tag for bookmark "${bookmark.id}" used ${response.totalTokens} tokens and inferred: ${tags}`,
    );

    // Sometimes the tags contain the hashtag symbol, let's strip them out if they do.
    // Additionally, trim the tags to prevent whitespaces at the beginning/the end of the tag.
    tags = tags.map((t) => {
      let tag = t;
      if (tag.startsWith("#")) {
        tag = t.slice(1);
      }
      return tag.trim();
    });

    return tags;
  } catch (e) {
    const responseSneak = response.response.substring(0, 20);
    throw new Error(
      `[inference][${jobId}] The model ignored our prompt and didn't respond with the expected JSON: ${JSON.stringify(e)}. Here's a sneak peak from the response: ${responseSneak}`,
    );
  }
}

async function connectTags(
  bookmarkId: string,
  inferredTags: string[],
  userId: string,
) {
  if (inferredTags.length == 0) {
    return;
  }

  await db.transaction(async (tx) => {
    // Attempt to match exiting tags with the new ones
    const { matchedTagIds, notFoundTagNames } = await (async () => {
      const { normalizeTag, sql: normalizedTagSql } = tagNormalizer(
        bookmarkTags.name,
      );
      const normalizedInferredTags = inferredTags.map((t) => ({
        originalTag: t,
        normalizedTag: normalizeTag(t),
      }));

      const matchedTags = await tx.query.bookmarkTags.findMany({
        where: and(
          eq(bookmarkTags.userId, userId),
          inArray(
            normalizedTagSql,
            normalizedInferredTags.map((t) => t.normalizedTag),
          ),
        ),
      });

      const matchedTagIds = matchedTags.map((r) => r.id);
      const notFoundTagNames = normalizedInferredTags
        .filter(
          (t) =>
            !matchedTags.some(
              (mt) => normalizeTag(mt.name) === t.normalizedTag,
            ),
        )
        .map((t) => t.originalTag);

      return { matchedTagIds, notFoundTagNames };
    })();

    // Create tags that didn't exist previously
    let newTagIds: string[] = [];
    if (notFoundTagNames.length > 0) {
      newTagIds = (
        await tx
          .insert(bookmarkTags)
          .values(
            notFoundTagNames.map((t) => ({
              name: t,
              userId,
            })),
          )
          .onConflictDoNothing()
          .returning()
      ).map((t) => t.id);
    }

    // Delete old AI tags
    await tx
      .delete(tagsOnBookmarks)
      .where(
        and(
          eq(tagsOnBookmarks.attachedBy, "ai"),
          eq(tagsOnBookmarks.bookmarkId, bookmarkId),
        ),
      );

    const allTagIds = new Set([...matchedTagIds, ...newTagIds]);

    // Attach new ones
    await tx
      .insert(tagsOnBookmarks)
      .values(
        [...allTagIds].map((tagId) => ({
          tagId,
          bookmarkId,
          attachedBy: "ai" as const,
        })),
      )
      .onConflictDoNothing();
  });
}

async function runOpenAI(job: DequeuedJob<ZOpenAIRequest>) {
  const jobId = job.id;

  const inferenceClient = InferenceClientFactory.build();
  if (!inferenceClient) {
    logger.debug(
      `[inference][${jobId}] No inference client configured, nothing to do now`,
    );
    return;
  }

  const request = zOpenAIRequestSchema.safeParse(job.data);
  if (!request.success) {
    throw new Error(
      `[inference][${jobId}] Got malformed job request: ${request.error.toString()}`,
    );
  }

  const { bookmarkId } = request.data;
  const bookmark = await fetchBookmark(bookmarkId);
  if (!bookmark) {
    throw new Error(
      `[inference][${jobId}] bookmark with id ${bookmarkId} was not found`,
    );
  }

  logger.info(
    `[inference][${jobId}] Starting an inference job for bookmark with id "${bookmark.id}"`,
  );

  const tags = await inferTags(jobId, bookmark, inferenceClient);

  await connectTags(bookmarkId, tags, bookmark.userId);

  // Update the search index
  await triggerSearchReindex(bookmarkId);
}
