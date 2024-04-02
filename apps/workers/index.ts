import "dotenv/config";

import serverConfig from "@hoarder/shared/config";
import logger from "@hoarder/shared/logger";

import { CrawlerWorker } from "./crawlerWorker";
import { shutdownPromise } from "./exit";
import { OpenAiWorker } from "./openaiWorker";
import { SearchIndexingWorker } from "./searchWorker";

async function main() {
  logger.info(`Workers version: ${serverConfig.serverVersion ?? "not set"}`);
  const [crawler, openai, search] = [
    await CrawlerWorker.build(),
    OpenAiWorker.build(),
    SearchIndexingWorker.build(),
  ];

  await Promise.any([
    Promise.all([crawler.run(), openai.run(), search.run()]),
    shutdownPromise,
  ]);
}

main();
