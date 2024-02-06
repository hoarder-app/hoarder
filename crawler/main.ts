import { Worker } from "bullmq";

import {
    LinkCrawlerQueue,
    queueConnectionDetails,
} from "@remember/shared/queues";
import logger from "@remember/shared/logger";
import runCrawler from "./crawler";

logger.info("Starting crawler worker ...");

const crawlerWorker = new Worker(LinkCrawlerQueue.name, runCrawler, {
    connection: queueConnectionDetails,
    autorun: false,
});

await Promise.all([crawlerWorker]);
