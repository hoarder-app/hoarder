import logger from "@karakeep/shared/logger";

export let isShuttingDown = false;

export const shutdownPromise = new Promise((resolve) => {
  process.on("SIGTERM", () => {
    logger.info("Received SIGTERM, shutting down ...");
    isShuttingDown = true;
    resolve("");
  });
});
