import { db } from "@hoarder/db";
import logger from "@hoarder/shared/logger";
import serverConfig from "@hoarder/shared/config";
import {
  OpenAIQueue,
  ZOpenAIRequest,
  queueConnectionDetails,
  zOpenAIRequestSchema,
} from "@hoarder/shared/queues";
import { Job } from "bullmq";
import OpenAI from "openai";
import { z } from "zod";
import { Worker } from "bullmq";
import {
  bookmarkLinks,
  bookmarkTags,
  bookmarks,
  tagsOnBookmarks,
} from "@hoarder/db/schema";
import { eq } from "drizzle-orm";

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

function buildPrompt(url: string, description: string) {
  return `

I'm building a read-it-later app and I need your help with automatic tagging.
Please analyze the following text and suggest relevant tags that describe its key themes, topics, and main ideas.
Aim for a variety of tags, including broad categories, specific keywords, and potential sub-genres. If it's a famous website
you may also include a tag for the website. Tags should be lowercases and don't contain spaces. If the tag is not generic enough, don't
include it. Aim for 3-5 tags. You must respond in JSON with the key "tags" and the value is list of tags.
----
URL: ${url}
Description: ${description}
  `;
}

async function fetchBookmark(linkId: string) {
  return await db.query.bookmarks.findFirst({
    where: eq(bookmarks.id, linkId),
    with: {
      link: true,
    },
  });
}

async function inferTags(
  jobId: string,
  link: typeof bookmarkLinks.$inferSelect,
  openai: OpenAI,
) {
  const linkDescription = link?.description;
  if (!linkDescription) {
    throw new Error(
      `[openai][${jobId}] No description found for link "${link.id}". Skipping ...`,
    );
  }

  const chatCompletion = await openai.chat.completions.create({
    messages: [
      { role: "system", content: buildPrompt(link.url, linkDescription) },
    ],
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
      `[openai][${jobId}] Inferring tag for url "${link.url}" used ${chatCompletion.usage?.total_tokens} tokens and inferred: ${tags}`,
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
  const res = await db
    .insert(bookmarkTags)
    .values(
      tags.map((t) => ({
        name: t,
        userId,
      })),
    )
    .onConflictDoNothing()
    .returning({ id: bookmarkTags.id });
  return res.map((r) => r.id);
}

async function connectTags(bookmarkId: string, tagIds: string[]) {
  await db.insert(tagsOnBookmarks).values(
    tagIds.map((tagId) => ({
      tagId,
      bookmarkId,
      attachedBy: "ai" as const,
    })),
  );
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

  if (!bookmark.link) {
    throw new Error(
      `[openai][${jobId}] bookmark with id ${bookmarkId} doesn't have a link`,
    );
  }

  const tags = await inferTags(jobId, bookmark.link, openai);

  const tagIds = await createTags(tags, bookmark.userId);
  await connectTags(bookmarkId, tagIds);
}
