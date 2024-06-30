import "dotenv/config";

import serverConfig from "@hoarder/shared/config";
import logger from "@hoarder/shared/logger";
import { runQueueDBMigrations } from "@hoarder/shared/queues";

import { CrawlerWorker } from "./crawlerWorker";
import { shutdownPromise } from "./exit";
import { OpenAiWorker } from "./openaiWorker";
import { SearchIndexingWorker } from "./searchWorker";
import { VideoWorker } from "./videoWorker";

async function main() {
  logger.info(`Workers version: ${serverConfig.serverVersion ?? "not set"}`);
  runQueueDBMigrations();

  const [crawler, openai, search, video] = [
    await CrawlerWorker.build(),
    OpenAiWorker.build(),
    SearchIndexingWorker.build(),
    await VideoWorker.build(),
  ];

  await Promise.any([
    Promise.all([crawler.run(), openai.run(), search.run(), video?.run()]),
    shutdownPromise,
  ]);
}

main();
