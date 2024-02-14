import { Queue } from "bullmq";
import { z } from "zod";
import serverConfig from "./config";

export const queueConnectionDetails = {
  host: serverConfig.bullMQ.redisHost,
  port: serverConfig.bullMQ.redisPort,
};

// Link Crawler
export const zCrawlLinkRequestSchema = z.object({
  bookmarkId: z.string(),
});
export type ZCrawlLinkRequest = z.infer<typeof zCrawlLinkRequestSchema>;

export const LinkCrawlerQueue = new Queue<ZCrawlLinkRequest, void>(
  "link_crawler_queue",
  { connection: queueConnectionDetails },
);

// OpenAI Worker
export const zOpenAIRequestSchema = z.object({
  bookmarkId: z.string(),
});
export type ZOpenAIRequest = z.infer<typeof zOpenAIRequestSchema>;

export const OpenAIQueue = new Queue<ZOpenAIRequest, void>("openai_queue", {
  connection: queueConnectionDetails,
});
