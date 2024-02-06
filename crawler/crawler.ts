import logger from "@remember/shared/logger";
import { Job } from "bullmq";

export default async function runCrawler(job: Job) {
    logger.info(`[Crawler] Got a new job: ${job.name}`);
}
