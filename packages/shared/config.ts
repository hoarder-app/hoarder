function buildAuthentikConfig() {
  const { AUTHENTIK_ID, AUTHENTIK_SECRET, AUTHENTIK_ISSUER } = process.env;

  if (!AUTHENTIK_ID || !AUTHENTIK_SECRET || !AUTHENTIK_ISSUER) {
    return undefined;
  }

  return {
    clientId: AUTHENTIK_ID,
    clientSecret: AUTHENTIK_SECRET,
    issuer: AUTHENTIK_ISSUER,
  };
}

const serverConfig = {
  apiUrl: process.env.API_URL || "http://localhost:3000",
  auth: {
    authentik: buildAuthentikConfig(),
  },
  openAI: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  bullMQ: {
    redisHost: process.env.REDIS_HOST || "localhost",
    redisPort: parseInt(process.env.REDIS_PORT || "6379"),
  },
  crawler: {
    headlessBrowser: (process.env.CRAWLER_HEADLESS_BROWSER ?? "true") == "true",
    browserExecutablePath: process.env.BROWSER_EXECUTABLE_PATH, // If not set, the system's browser will be used
    browserUserDataDir: process.env.BROWSER_USER_DATA_DIR,
  },
  logLevel: process.env.LOG_LEVEL || "debug",
  demoMode: (process.env.DEMO_MODE ?? "false") == "true",
};

export default serverConfig;
