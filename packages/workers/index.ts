import "dotenv/config";
import { CrawlerWorker } from "./crawler";
import { OpenAiWorker } from "./openai";
import { SearchIndexingWorker } from "./search";

async function main() {
  const [crawler, openai, search] = [
    await CrawlerWorker.build(),
    await OpenAiWorker.build(),
    await SearchIndexingWorker.build(),
  ];

  await Promise.all([crawler.run(), openai.run(), search.run()]);
}

main();
