import "dotenv/config";

import { CrawlerWorker } from "./crawlerWorker";
import { shutdownPromise } from "./exit";
import { OpenAiWorker } from "./openaiWorker";
import { SearchIndexingWorker } from "./searchWorker";

async function main() {
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
