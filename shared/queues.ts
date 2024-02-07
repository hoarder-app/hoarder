import { Queue } from "bullmq";
import { z } from "zod";

export const queueConnectionDetails = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

// Link Crawler
export const zCrawlLinkRequestSchema = z.object({
  linkId: z.string(),
  url: z.string().url(),
});
export type ZCrawlLinkRequest = z.infer<typeof zCrawlLinkRequestSchema>;

export const LinkCrawlerQueue = new Queue<ZCrawlLinkRequest, void>(
  "link_crawler_queue",
  { connection: queueConnectionDetails },
);

// OpenAI Worker
export const zOpenAIRequestSchema = z.object({
  linkId: z.string(),
});
export type ZOpenAIRequest = z.infer<typeof zOpenAIRequestSchema>;

export const OpenAIQueue = new Queue<ZOpenAIRequest, void>("openai_queue", {
  connection: queueConnectionDetails,
});
