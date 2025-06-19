import { and, Column, eq, inArray, sql } from "drizzle-orm";
import { DequeuedJob } from "liteque";
import { buildImpersonatingTRPCClient } from "trpc";
import { z } from "zod";

import type { InferenceClient } from "@karakeep/shared/inference";
import type { ZOpenAIRequest } from "@karakeep/shared/queues";
import { db } from "@karakeep/db";
import {
  bookmarks,
  bookmarkTags,
  customPrompts,
  tagsOnBookmarks,
} from "@karakeep/db/schema";
import { readAsset } from "@karakeep/shared/assetdb";
import serverConfig from "@karakeep/shared/config";
import logger from "@karakeep/shared/logger";
import { buildImagePrompt, buildTextPrompt } from "@karakeep/shared/prompts";
import {
  triggerRuleEngineOnEvent,
  triggerSearchReindex,
  triggerWebhook,
} from "@karakeep/shared/queues";

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

async function inferTagsFromImage(
  jobId: string,
  bookmark: NonNullable<Awaited<ReturnType<typeof fetchBookmark>>>,
  inferenceClient: InferenceClient,
  abortSignal: AbortSignal,
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
    buildImagePrompt(
      serverConfig.inference.inferredTagLang,
      await fetchCustomPrompts(bookmark.userId, "images"),
    ),
    metadata.contentType,
    base64,
    { schema: openAIResponseSchema, abortSignal },
  );
}

async function fetchCustomPrompts(
  userId: string,
  appliesTo: "text" | "images",
) {
  const prompts = await db.query.customPrompts.findMany({
    where: and(
      eq(customPrompts.userId, userId),
      inArray(customPrompts.appliesTo, ["all_tagging", appliesTo]),
    ),
    columns: {
      text: true,
    },
  });

  let promptTexts = prompts.map((p) => p.text);
  if (containsTagsPlaceholder(prompts)) {
    promptTexts = await replaceTagsPlaceholders(promptTexts, userId);
  }

  return promptTexts;
}

async function replaceTagsPlaceholders(
  prompts: string[],
  userId: string,
): Promise<string[]> {
  const api = await buildImpersonatingTRPCClient(userId);
  const tags = (await api.tags.list()).tags;
  const tagsString = `[${tags.map((tag) => tag.name).join(", ")}]`;
  const aiTagsString = `[${tags
    .filter((tag) => tag.numBookmarksByAttachedType.human ?? 0 == 0)
    .map((tag) => tag.name)
    .join(", ")}]`;
  const userTagsString = `[${tags
    .filter((tag) => tag.numBookmarksByAttachedType.human ?? 0 > 0)
    .map((tag) => tag.name)
    .join(", ")}]`;

  return prompts.map((p) =>
    p
      .replaceAll("$tags", tagsString)
      .replaceAll("$aiTags", aiTagsString)
      .replaceAll("$userTags", userTagsString),
  );
}

function containsTagsPlaceholder(prompts: { text: string }[]): boolean {
  return (
    prompts.filter(
      (p) =>
        p.text.includes("$tags") ||
        p.text.includes("$aiTags") ||
        p.text.includes("$userTags"),
    ).length > 0
  );
}

async function inferTagsFromPDF(
  _jobId: string,
  bookmark: NonNullable<Awaited<ReturnType<typeof fetchBookmark>>>,
  inferenceClient: InferenceClient,
  abortSignal: AbortSignal,
) {
  const prompt = buildTextPrompt(
    serverConfig.inference.inferredTagLang,
    await fetchCustomPrompts(bookmark.userId, "text"),
    `Content: ${bookmark.asset.content}`,
    serverConfig.inference.contextLength,
  );
  return inferenceClient.inferFromText(prompt, {
    schema: openAIResponseSchema,
    abortSignal,
  });
}

async function inferTagsFromText(
  bookmark: NonNullable<Awaited<ReturnType<typeof fetchBookmark>>>,
  inferenceClient: InferenceClient,
  abortSignal: AbortSignal,
) {
  return await inferenceClient.inferFromText(await buildPrompt(bookmark), {
    schema: openAIResponseSchema,
    abortSignal,
  });
}

async function inferTags(
  jobId: string,
  bookmark: NonNullable<Awaited<ReturnType<typeof fetchBookmark>>>,
  inferenceClient: InferenceClient,
  abortSignal: AbortSignal,
) {
  let response;
  if (bookmark.link || bookmark.text) {
    response = await inferTagsFromText(bookmark, inferenceClient, abortSignal);
  } else if (bookmark.asset) {
    switch (bookmark.asset.assetType) {
      case "image":
        response = await inferTagsFromImage(
          jobId,
          bookmark,
          inferenceClient,
          abortSignal,
        );
        break;
      case "pdf":
        response = await inferTagsFromPDF(
          jobId,
          bookmark,
          inferenceClient,
          abortSignal,
        );
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
    const detachedTags = await tx
      .delete(tagsOnBookmarks)
      .where(
        and(
          eq(tagsOnBookmarks.attachedBy, "ai"),
          eq(tagsOnBookmarks.bookmarkId, bookmarkId),
        ),
      )
      .returning();

    const allTagIds = new Set([...matchedTagIds, ...newTagIds]);

    // Attach new ones
    const attachedTags = await tx
      .insert(tagsOnBookmarks)
      .values(
        [...allTagIds].map((tagId) => ({
          tagId,
          bookmarkId,
          attachedBy: "ai" as const,
        })),
      )
      .onConflictDoNothing()
      .returning();

    await triggerRuleEngineOnEvent(bookmarkId, [
      ...detachedTags.map((t) => ({
        type: "tagRemoved" as const,
        tagId: t.tagId,
      })),
      ...attachedTags.map((t) => ({
        type: "tagAdded" as const,
        tagId: t.tagId,
      })),
    ]);
  });
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

export async function runTagging(
  bookmarkId: string,
  job: DequeuedJob<ZOpenAIRequest>,
  inferenceClient: InferenceClient,
) {
  if (!serverConfig.inference.enableAutoTagging) {
    logger.info(
      `[inference][${job.id}] Skipping tagging job for bookmark with id "${bookmarkId}" because it's disabled in the config.`,
    );
    return;
  }
  const jobId = job.id;
  const bookmark = await fetchBookmark(bookmarkId);
  if (!bookmark) {
    throw new Error(
      `[inference][${jobId}] bookmark with id ${bookmarkId} was not found`,
    );
  }

  logger.info(
    `[inference][${jobId}] Starting an inference job for bookmark with id "${bookmark.id}"`,
  );

  const tags = await inferTags(
    jobId,
    bookmark,
    inferenceClient,
    job.abortSignal,
  );

  await connectTags(bookmarkId, tags, bookmark.userId);

  // Trigger a webhook
  await triggerWebhook(bookmarkId, "ai tagged");

  // Update the search index
  await triggerSearchReindex(bookmarkId);
}
