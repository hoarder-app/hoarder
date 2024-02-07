import { Worker } from "bullmq";

import {
  LinkCrawlerQueue,
  ZCrawlLinkRequest,
  queueConnectionDetails,
} from "@remember/shared/queues";
import logger from "@remember/shared/logger";
import runCrawler from "./crawler";

logger.info("Starting crawler worker ...");

const crawlerWorker = new Worker<ZCrawlLinkRequest, void>(
  LinkCrawlerQueue.name,
  runCrawler,
  {
    connection: queueConnectionDetails,
    autorun: false,
  },
);

crawlerWorker.on("completed", (job) => {
  const jobId = job?.id || "unknown";
  logger.info(`[Crawler][${jobId}] Completed successfully`);
});

crawlerWorker.on("failed", (job, error) => {
  const jobId = job?.id || "unknown";
  logger.error(`[Crawler][${jobId}] Crawling job failed: ${error}`);
});

await Promise.all([crawlerWorker.run()]);
