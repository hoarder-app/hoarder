import { db } from "@hoarder/db";
import logger from "@hoarder/shared/logger";
import serverConfig from "@hoarder/shared/config";
import {
  OpenAIQueue,
  SearchIndexingQueue,
  ZOpenAIRequest,
  queueConnectionDetails,
  zOpenAIRequestSchema,
} from "@hoarder/shared/queues";
import { Job } from "bullmq";
import OpenAI from "openai";
import { z } from "zod";
import { Worker } from "bullmq";
import { bookmarkTags, bookmarks, tagsOnBookmarks } from "@hoarder/db/schema";
import { and, eq, inArray } from "drizzle-orm";

const openAIResponseSchema = z.object({
  tags: z.array(z.string()),
});

export class OpenAiWorker {
  static async build() {
    logger.info("Starting openai worker ...");
    const worker = new Worker<ZOpenAIRequest, void>(
      OpenAIQueue.name,
      runOpenAI,
      {
        connection: queueConnectionDetails,
        autorun: false,
      },
    );

    worker.on("completed", (job) => {
      const jobId = job?.id || "unknown";
      logger.info(`[openai][${jobId}] Completed successfully`);
    });

    worker.on("failed", (job, error) => {
      const jobId = job?.id || "unknown";
      logger.error(`[openai][${jobId}] openai job failed: ${error}`);
    });

    return worker;
  }
}

const PROMPT_BASE = `
I'm building a read-it-later app and I need your help with automatic tagging.
Please analyze the text after the sentence "CONTENT:" and suggest relevant tags that describe its key themes, topics, and main ideas.
Aim for a variety of tags, including broad categories, specific keywords, and potential sub-genres. If it's a famous website
you may also include a tag for the website. Tags should be lowercases and don't contain spaces. If the tag is not generic enough, don't
include it. Aim for 3-5 tags. If there are no good tags, don't emit any. You must respond in JSON with the key "tags" and the value is list of tags.
CONTENT:
`;

function buildPrompt(
  bookmark: NonNullable<Awaited<ReturnType<typeof fetchBookmark>>>,
) {
  if (bookmark.link) {
    if (!bookmark.link.description) {
      throw new Error(
        `No description found for link "${bookmark.id}". Skipping ...`,
      );
    }
    return `
${PROMPT_BASE}
URL: ${bookmark.link.url}
Description: ${bookmark.link.description}
  `;
  }

  if (bookmark.text) {
    // TODO: Ensure that the content doesn't exceed the context length of openai
    return `
${PROMPT_BASE}
${bookmark.text.text}
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
    },
  });
}

async function inferTags(
  jobId: string,
  bookmark: NonNullable<Awaited<ReturnType<typeof fetchBookmark>>>,
  openai: OpenAI,
) {
  const chatCompletion = await openai.chat.completions.create({
    messages: [{ role: "system", content: buildPrompt(bookmark) }],
    model: "gpt-3.5-turbo-0125",
    response_format: { type: "json_object" },
  });

  const response = chatCompletion.choices[0].message.content;
  if (!response) {
    throw new Error(`[openai][${jobId}] Got no message content from OpenAI`);
  }

  try {
    let tags = openAIResponseSchema.parse(JSON.parse(response)).tags;
    logger.info(
      `[openai][${jobId}] Inferring tag for bookmark "${bookmark.id}" used ${chatCompletion.usage?.total_tokens} tokens and inferred: ${tags}`,
    );

    // Sometimes the tags contain the hashtag symbol, let's strip them out if they do.
    tags = tags.map((t) => {
      if (t.startsWith("#")) {
        return t.slice(1);
      }
      return t;
    });

    return tags;
  } catch (e) {
    throw new Error(
      `[openai][${jobId}] Failed to parse JSON response from OpenAI: ${e}`,
    );
  }
}

async function createTags(tags: string[], userId: string) {
  if (tags.length == 0) {
    return [];
  }
  await db
    .insert(bookmarkTags)
    .values(
      tags.map((t) => ({
        name: t,
        userId,
      })),
    )
    .onConflictDoNothing();

  const res = await db.query.bookmarkTags.findMany({
    where: and(
      eq(bookmarkTags.userId, userId),
      inArray(bookmarkTags.name, tags),
    ),
    columns: {
      id: true,
    },
  });

  return res.map((r) => r.id);
}

async function connectTags(bookmarkId: string, tagIds: string[]) {
  if (tagIds.length == 0) {
    return;
  }
  await db
    .insert(tagsOnBookmarks)
    .values(
      tagIds.map((tagId) => ({
        tagId,
        bookmarkId,
        attachedBy: "ai" as const,
      })),
    )
    .onConflictDoNothing();
}

async function runOpenAI(job: Job<ZOpenAIRequest, void>) {
  const jobId = job.id || "unknown";

  const { openAI } = serverConfig;

  if (!openAI.apiKey) {
    logger.debug(
      `[openai][${jobId}] OpenAI is not configured, nothing to do now`,
    );
    return;
  }

  const openai = new OpenAI({
    apiKey: openAI.apiKey,
  });

  const request = zOpenAIRequestSchema.safeParse(job.data);
  if (!request.success) {
    throw new Error(
      `[openai][${jobId}] Got malformed job request: ${request.error.toString()}`,
    );
  }

  const { bookmarkId } = request.data;
  const bookmark = await fetchBookmark(bookmarkId);
  if (!bookmark) {
    throw new Error(
      `[openai][${jobId}] bookmark with id ${bookmarkId} was not found`,
    );
  }

  const tags = await inferTags(jobId, bookmark, openai);

  const tagIds = await createTags(tags, bookmark.userId);
  await connectTags(bookmarkId, tagIds);

  // Update the search index
  SearchIndexingQueue.add("search_indexing", {
    bookmarkId,
    type: "index",
  });
}
