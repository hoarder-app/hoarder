import { Queue } from "bullmq";

export const queueConnectionDetails = {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
};

export const LinkCrawlerQueue = new Queue("link_crawler_queue", { connection: queueConnectionDetails });


