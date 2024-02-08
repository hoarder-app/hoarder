import { Worker } from "bullmq";

import dotenv from "dotenv";

import {
  LinkCrawlerQueue,
  OpenAIQueue,
  ZCrawlLinkRequest,
  ZOpenAIRequest,
  queueConnectionDetails,
} from "@remember/shared/queues";
import logger from "@remember/shared/logger";
import runCrawler from "./crawler";
import runOpenAI from "./openai";

function crawlerWorker() {
  logger.info("Starting crawler worker ...");
  const worker = new Worker<ZCrawlLinkRequest, void>(
    LinkCrawlerQueue.name,
    runCrawler,
    {
      connection: queueConnectionDetails,
      autorun: false,
    },
  );

  worker.on("completed", (job) => {
    const jobId = job?.id || "unknown";
    logger.info(`[Crawler][${jobId}] Completed successfully`);
  });

  worker.on("failed", (job, error) => {
    const jobId = job?.id || "unknown";
    logger.error(`[Crawler][${jobId}] Crawling job failed: ${error}`);
  });

  return worker;
}

function openaiWorker() {
  logger.info("Starting openai worker ...");
  const worker = new Worker<ZOpenAIRequest, void>(OpenAIQueue.name, runOpenAI, {
    connection: queueConnectionDetails,
    autorun: false,
  });

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

async function main() {
  dotenv.config();
  await Promise.all([crawlerWorker().run(), openaiWorker().run()]);
}

main();
