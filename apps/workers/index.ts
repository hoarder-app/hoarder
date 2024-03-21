import "dotenv/config";
import { CrawlerWorker } from "./crawlerWorker";
import { OpenAiWorker } from "./openaiWorker";
import { SearchIndexingWorker } from "./searchWorker";
import { shutdownPromise } from "./exit";

async function main() {
  const [crawler, openai, search] = [
    await CrawlerWorker.build(),
    await OpenAiWorker.build(),
    await SearchIndexingWorker.build(),
  ];

  await Promise.any([
    Promise.all([crawler.run(), openai.run(), search.run()]),
    shutdownPromise,
  ]);
}

main();
