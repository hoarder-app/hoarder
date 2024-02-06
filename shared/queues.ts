import { Queue } from "bullmq";
import { z } from "zod";

export const queueConnectionDetails = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

export const zCrawlLinkRequestSchema = z.object({
  linkId: z.string(),
  url: z.string().url(),
});
export type ZCrawlLinkRequest = z.infer<typeof zCrawlLinkRequestSchema>;

export const LinkCrawlerQueue = new Queue<ZCrawlLinkRequest, void>(
  "link_crawler_queue",
  { connection: queueConnectionDetails },
);
