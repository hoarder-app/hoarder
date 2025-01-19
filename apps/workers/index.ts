import "dotenv/config";

import { AssetPreprocessingWorker } from "assetPreprocessingWorker";
import { FeedRefreshingWorker, FeedWorker } from "feedWorker";
import { TidyAssetsWorker } from "tidyAssetsWorker";

import serverConfig from "@hoarder/shared/config";
import logger from "@hoarder/shared/logger";
import { runQueueDBMigrations } from "@hoarder/shared/queues";

import { CrawlerWorker } from "./crawlerWorker";
import { shutdownPromise } from "./exit";
import { OpenAiWorker } from "./openaiWorker";
import { SearchIndexingWorker } from "./searchWorker";
import { VideoWorker } from "./videoWorker";
import { WebhookWorker } from "./webhookWorker";

async function main() {
  logger.info(`Workers version: ${serverConfig.serverVersion ?? "not set"}`);
  runQueueDBMigrations();

  const [
    crawler,
    openai,
    search,
    tidyAssets,
    video,
    feed,
    assetPreprocessing,
    webhook,
  ] = [
    await CrawlerWorker.build(),
    OpenAiWorker.build(),
    SearchIndexingWorker.build(),
    TidyAssetsWorker.build(),
    VideoWorker.build(),
    FeedWorker.build(),
    AssetPreprocessingWorker.build(),
    WebhookWorker.build(),
  ];
  FeedRefreshingWorker.start();

  await Promise.any([
    Promise.all([
      crawler.run(),
      openai.run(),
      search.run(),
      tidyAssets.run(),
      video.run(),
      feed.run(),
      assetPreprocessing.run(),
      webhook.run(),
    ]),
    shutdownPromise,
  ]);
  logger.info(
    "Shutting down crawler, openai, tidyAssets, video, feed, assetPreprocessing, webhook and search workers ...",
  );

  FeedRefreshingWorker.stop();
  crawler.stop();
  openai.stop();
  search.stop();
  tidyAssets.stop();
  video.stop();
  feed.stop();
  assetPreprocessing.stop();
  webhook.stop();
}

main();
