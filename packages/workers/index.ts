import "dotenv/config";
import { CrawlerWorker } from "./crawler";
import { OpenAiWorker } from "./openai";

async function main() {
  const [crawler, openai] = [
    await CrawlerWorker.build(),
    await OpenAiWorker.build(),
  ];

  await Promise.all([crawler.run(), openai.run()]);
}

main();
