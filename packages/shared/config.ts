const serverConfig = {
  apiUrl: process.env.API_URL ?? "http://localhost:3000",
  auth: {
    disableSignups: (process.env.DISABLE_SIGNUPS ?? "false") == "true",
  },
  openAI: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  bullMQ: {
    redisHost: process.env.REDIS_HOST ?? "localhost",
    redisPort: parseInt(process.env.REDIS_PORT ?? "6379"),
  },
  crawler: {
    headlessBrowser: (process.env.CRAWLER_HEADLESS_BROWSER ?? "true") == "true",
    browserExecutablePath: process.env.BROWSER_EXECUTABLE_PATH, // If not set, the system's browser will be used
    browserUserDataDir: process.env.BROWSER_USER_DATA_DIR,
    browserWebUrl: process.env.BROWSER_WEB_URL,
  },
  meilisearch: process.env.MEILI_ADDR
    ? {
        address: process.env.MEILI_ADDR ?? "http://127.0.0.1:7700",
        key: process.env.MEILI_MASTER_KEY ?? "",
      }
    : undefined,
  logLevel: process.env.LOG_LEVEL ?? "debug",
  demoMode: (process.env.DEMO_MODE ?? "false") == "true" ? {
    email: process.env.DEMO_MODE_EMAIL,
    password: process.env.DEMO_MODE_PASSWORD,
  }: undefined,
  dataDir: process.env.DATA_DIR ?? "",
};

// Always explicitly pick up stuff from server config to avoid accidentally leaking stuff
export const clientConfig = {
  demoMode: serverConfig.demoMode,
  auth: {
    disableSignups: serverConfig.auth.disableSignups,
  }
};
export type ClientConfig = typeof clientConfig;

export default serverConfig;
