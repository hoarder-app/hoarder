import { z } from "zod";

const stringBool = (defaultValue: string) =>
  z
    .string()
    .default(defaultValue)
    .refine((s) => s === "true" || s === "false")
    .transform((s) => s === "true");

const allEnv = z.object({
  API_URL: z.string().url().default("http://localhost:3000"),
  DISABLE_SIGNUPS: stringBool("false"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().url().optional(),
  OLLAMA_BASE_URL: z.string().url().optional(),
  INFERENCE_TEXT_MODEL: z.string().default("gpt-3.5-turbo-0125"),
  INFERENCE_IMAGE_MODEL: z.string().default("gpt-4-turbo"),
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_DB_IDX: z.coerce.number().optional(),
  CRAWLER_HEADLESS_BROWSER: stringBool("true"),
  BROWSER_WEB_URL: z.string().url().optional(),
  CRAWLER_JOB_TIMEOUT_SEC: z.number().default(60),
  MEILI_ADDR: z.string().optional(),
  MEILI_MASTER_KEY: z.string().default(""),
  LOG_LEVEL: z.string().default("debug"),
  DEMO_MODE: stringBool("false"),
  DEMO_MODE_EMAIL: z.string().optional(),
  DEMO_MODE_PASSWORD: z.string().optional(),
  DATA_DIR: z.string().default(""),
  MAX_ASSET_SIZE_MB: z.coerce.number().default(4),
  INFERENCE_LANG: z.string().default("english"),
  // Build only flag
  SERVER_VERSION: z.string().optional(),
  DISABLE_NEW_RELEASE_CHECK: stringBool("false"),
});

const serverConfigSchema = allEnv.transform((val) => {
  return {
    apiUrl: val.API_URL,
    auth: {
      disableSignups: val.DISABLE_SIGNUPS,
    },
    inference: {
      openAIApiKey: val.OPENAI_API_KEY,
      openAIBaseUrl: val.OPENAI_BASE_URL,
      ollamaBaseUrl: val.OLLAMA_BASE_URL,
      textModel: val.INFERENCE_TEXT_MODEL,
      imageModel: val.INFERENCE_IMAGE_MODEL,
      inferredTagLang: val.INFERENCE_LANG,
    },
    bullMQ: {
      redisHost: val.REDIS_HOST,
      redisPort: val.REDIS_PORT,
      redisDBIdx: val.REDIS_DB_IDX,
    },
    crawler: {
      headlessBrowser: val.CRAWLER_HEADLESS_BROWSER,
      browserWebUrl: val.BROWSER_WEB_URL,
      jobTimeoutSec: val.CRAWLER_JOB_TIMEOUT_SEC,
    },
    meilisearch: val.MEILI_ADDR
      ? {
          address: val.MEILI_ADDR,
          key: val.MEILI_MASTER_KEY,
        }
      : undefined,
    logLevel: val.LOG_LEVEL,
    demoMode: val.DEMO_MODE
      ? {
          email: val.DEMO_MODE_EMAIL,
          password: val.DEMO_MODE_PASSWORD,
        }
      : undefined,
    dataDir: val.DATA_DIR,
    maxAssetSizeMb: val.MAX_ASSET_SIZE_MB,
    serverVersion: val.SERVER_VERSION,
    disableNewReleaseCheck: val.DISABLE_NEW_RELEASE_CHECK,
  };
});

const serverConfig = serverConfigSchema.parse(process.env);
// Always explicitly pick up stuff from server config to avoid accidentally leaking stuff
export const clientConfig = {
  demoMode: serverConfig.demoMode,
  auth: {
    disableSignups: serverConfig.auth.disableSignups,
  },
  serverVersion: serverConfig.serverVersion,
  disableNewReleaseCheck: serverConfig.disableNewReleaseCheck,
};
export type ClientConfig = typeof clientConfig;

export default serverConfig;
