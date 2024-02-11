import dotenv from "dotenv";
import { CrawlerWorker } from "./crawler";
import { OpenAiWorker } from "./openai";

async function main() {
  dotenv.config();

  const [crawler, openai] = [
    await CrawlerWorker.build(),
    await OpenAiWorker.build(),
  ];

  await Promise.all([crawler.run(), openai.run()]);
}

main();
