import "dotenv/config";
import { CrawlerWorker } from "./crawlerWorker";
import { OpenAiWorker } from "./openaiWorker";
import { SearchIndexingWorker } from "./searchWorker";

async function main() {
  const [crawler, openai, search] = [
    await CrawlerWorker.build(),
    await OpenAiWorker.build(),
    await SearchIndexingWorker.build(),
  ];

  await Promise.all([crawler.run(), openai.run(), search.run()]);
}

main();
