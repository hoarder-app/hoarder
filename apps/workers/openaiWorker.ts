import type { Job } from "bullmq";
import { Worker } from "bullmq";
import { and, Column, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import type { ZOpenAIRequest } from "@hoarder/shared/queues";
import { db } from "@hoarder/db";
import {
  bookmarkAssets,
  bookmarks,
  bookmarkTags,
  tagsOnBookmarks,
} from "@hoarder/db/schema";
import { readAsset } from "@hoarder/shared/assetdb";
import serverConfig from "@hoarder/shared/config";
import logger from "@hoarder/shared/logger";
import {
  OpenAIQueue,
  queueConnectionDetails,
  triggerSearchReindex,
  zOpenAIRequestSchema,
} from "@hoarder/shared/queues";

import type { InferenceClient } from "./inference";
import { InferenceClientFactory } from "./inference";
import { readPDFText, truncateContent } from "./utils";

const openAIResponseSchema = z.object({
  tags: z.array(z.string()),
});

function tagNormalizer(col: Column) {
  function normalizeTag(tag: string) {
    return tag.toLowerCase().replace(/[ -_]/g, "");
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
    const worker = new Worker<ZOpenAIRequest, void>(
      OpenAIQueue.name,
      runOpenAI,
      {
        connection: queueConnectionDetails,
        autorun: false,
      },
    );

    worker.on("completed", (job) => {
      const jobId = job?.id ?? "unknown";
      logger.info(`[inference][${jobId}] Completed successfully`);
      attemptMarkTaggingStatus(job?.data, "success");
    });

    worker.on("failed", (job, error) => {
      const jobId = job?.id ?? "unknown";
      logger.error(`[inference][${jobId}] inference job failed: ${error}`);
      attemptMarkTaggingStatus(job?.data, "failure");
    });

    return worker;
  }
}

const IMAGE_PROMPT_BASE = `
I'm building a read-it-later app and I need your help with automatic tagging.
Please analyze the attached image and suggest relevant tags that describe its key themes, topics, and main ideas.
Aim for a variety of tags, including broad categories, specific keywords, and potential sub-genres. The tags language must be ${serverConfig.inference.inferredTagLang}.
If the tag is not generic enough, don't include it. Aim for 10-15 tags. If there are no good tags, don't emit any. You must respond in valid JSON
with the key "tags" and the value is list of tags. Don't wrap the response in a markdown code.`;

const TEXT_PROMPT_BASE = `
I'm building a read-it-later app and I need your help with automatic tagging.
Please analyze the text between the sentences "CONTENT START HERE" and "CONTENT END HERE" and suggest relevant tags that describe its key themes, topics, and main ideas.
Aim for a variety of tags, including broad categories, specific keywords, and potential sub-genres. The tags language must be ${serverConfig.inference.inferredTagLang}. If it's a famous website
you may also include a tag for the website. If the tag is not generic enough, don't include it.
The content can include text for cookie consent and privacy policy, ignore those while tagging.
CONTENT START HERE
`;

const TEXT_PROMPT_INSTRUCTIONS = `
CONTENT END HERE
You must respond in JSON with the key "tags" and the value is an array of string tags. 
Aim for 3-5 tags. If there are no good tags, leave the array empty.
`;

function buildPrompt(
  bookmark: NonNullable<Awaited<ReturnType<typeof fetchBookmark>>>,
) {
  if (bookmark.link) {
    if (!bookmark.link.description && !bookmark.link.content) {
      throw new Error(
        `No content found for link "${bookmark.id}". Skipping ...`,
      );
    }

    let content = bookmark.link.content;
    if (content) {
      content = truncateContent(content);
    }
    return `
${TEXT_PROMPT_BASE}
URL: ${bookmark.link.url}
Title: ${bookmark.link.title ?? ""}
Description: ${bookmark.link.description ?? ""}
Content: ${content ?? ""}
${TEXT_PROMPT_INSTRUCTIONS}`;
  }

  if (bookmark.text) {
    const content = truncateContent(bookmark.text.text ?? "");
    // TODO: Ensure that the content doesn't exceed the context length of openai
    return `
${TEXT_PROMPT_BASE}
${content}
${TEXT_PROMPT_INSTRUCTIONS}
  `;
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
  const base64 = asset.toString("base64");
  return inferenceClient.inferFromImage(
    IMAGE_PROMPT_BASE,
    metadata.contentType,
    base64,
  );
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

  const prompt = `${TEXT_PROMPT_BASE}
Content: ${truncateContent(pdfParse.text)}
${TEXT_PROMPT_INSTRUCTIONS}
`;
  return inferenceClient.inferFromText(prompt);
}

async function inferTagsFromText(
  bookmark: NonNullable<Awaited<ReturnType<typeof fetchBookmark>>>,
  inferenceClient: InferenceClient,
) {
  return await inferenceClient.inferFromText(buildPrompt(bookmark));
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
    const responseSneak = response.response.substr(0, 20);
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

async function runOpenAI(job: Job<ZOpenAIRequest, void>) {
  const jobId = job.id ?? "unknown";

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
  triggerSearchReindex(bookmarkId);
}
