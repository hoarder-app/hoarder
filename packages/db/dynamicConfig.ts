import {
  AI_PROVIDER,
  dynamicConfigSchemaType,
} from "@hoarder/shared/types/admin";

import { db } from "./drizzle";
import { serverConfig } from "./schema";

function createDefaultDynamicConfig(): dynamicConfigSchemaType {
  return {
    generalSettings: {
      disableSignups: false,
      maxAssetSize: 4,
      disableNewReleaseCheck: false,
    },
    crawlerConfig: {
      downloadBannerImage: true,
      storeScreenshot: true,
      storeFullPageScreenshot: false,
      jobTimeout: 60,
      navigateTimeout: 30,
    },
    aiConfig: {
      aiProvider: AI_PROVIDER.DISABLED,
    },
  };
}

function parseNumber(variable: string | undefined): number | undefined {
  if (!variable) {
    return;
  }
  try {
    return parseInt(variable);
  } catch {
    return void 0;
  }
}

function parseBoolean(variable: string | undefined): boolean {
  return variable === "true";
}

export function augmentConfigFromEnv(
  config: dynamicConfigSchemaType,
): dynamicConfigSchemaType {
  // General Settings
  if (process.env.DISABLE_SIGNUPS) {
    config.generalSettings.disableSignups = parseBoolean(
      process.env.DISABLE_SIGNUPS,
    );
  }
  if (process.env.MAX_ASSET_SIZE_MB) {
    config.generalSettings.maxAssetSize =
      parseNumber(process.env.MAX_ASSET_SIZE_MB) ??
      config.generalSettings.maxAssetSize;
  }
  if (process.env.DISABLE_NEW_RELEASE_CHECK) {
    config.generalSettings.disableNewReleaseCheck = parseBoolean(
      process.env.DISABLE_NEW_RELEASE_CHECK,
    );
  }

  // Crawler settings
  if (process.env.CRAWLER_DOWNLOAD_BANNER_IMAGE) {
    config.crawlerConfig.downloadBannerImage = parseBoolean(
      process.env.CRAWLER_DOWNLOAD_BANNER_IMAGE,
    );
  }
  if (process.env.CRAWLER_STORE_SCREENSHOT) {
    config.crawlerConfig.storeScreenshot = parseBoolean(
      process.env.CRAWLER_STORE_SCREENSHOT,
    );
  }
  if (process.env.CRAWLER_FULL_PAGE_SCREENSHOT) {
    config.crawlerConfig.storeFullPageScreenshot = parseBoolean(
      process.env.CRAWLER_FULL_PAGE_SCREENSHOT,
    );
  }
  if (process.env.CRAWLER_JOB_TIMEOUT_SEC) {
    config.crawlerConfig.jobTimeout =
      parseNumber(process.env.CRAWLER_JOB_TIMEOUT_SEC) ??
      config.crawlerConfig.jobTimeout;
  }
  if (process.env.CRAWLER_NAVIGATE_TIMEOUT_SEC) {
    config.crawlerConfig.navigateTimeout =
      parseNumber(process.env.CRAWLER_NAVIGATE_TIMEOUT_SEC) ??
      config.crawlerConfig.navigateTimeout;
  }

  if (process.env.OPENAI_API_KEY) {
    config.aiConfig = {
      aiProvider: AI_PROVIDER.OPEN_AI,
      OpenAI: {
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.OPENAI_BASE_URL ?? "",
        inferenceTextModel:
          process.env.INFERENCE_TEXT_MODEL ?? "gpt-3.5-turbo-0125",
        inferenceImageModel:
          process.env.INFERENCE_IMAGE_MODEL ?? "gpt-4o-2024-05-13",
        inferenceLanguage: process.env.INFERENCE_LANG ?? "english",
      },
    };
  } else if (process.env.OLLAMA_BASE_URL) {
    config.aiConfig = {
      aiProvider: AI_PROVIDER.OLLAMA,
      Ollama: {
        baseURL: process.env.OLLAMA_BASE_URL,
        inferenceTextModel: process.env.INFERENCE_TEXT_MODEL ?? "llama3",
        inferenceImageModel: process.env.INFERENCE_IMAGE_MODEL ?? "llava",
        inferenceLanguage: process.env.INFERENCE_LANG ?? "english",
      },
    };
  }

  return config;
}

async function queryDynamicConfigFromDatabase(): Promise<dynamicConfigSchemaType> {
  const rows = await db.select().from(serverConfig);

  const config = createDefaultDynamicConfig();

  for (const row of rows) {
    // Split the key into its components
    const keys = row.key.split(".");

    // Start with the root of the config object
    let currentPart: Record<string, unknown> = config;

    // Iterate over each component in the key
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];

      if (i === keys.length - 1) {
        // If this is the last component, set the value
        switch (row.type) {
          case "string":
            currentPart[key] = String(row.value);
            break;
          case "number":
            currentPart[key] = Number(row.value);
            break;
          case "boolean":
            currentPart[key] = row.value === "true";
            break;
          default:
            throw new Error(`Invalid type ${row.type}`);
        }
      } else {
        // If this is not the last component, go deeper into the config object
        if (!currentPart[key]) {
          currentPart[key] = {};
        }
        currentPart = currentPart[key] as Record<string, unknown>;
      }
    }
  }
  return config;
}

export async function getDynamicConfig(): Promise<dynamicConfigSchemaType> {
  const config = await queryDynamicConfigFromDatabase();
  console.log("stored config", config);
  const augmentedConfig = augmentConfigFromEnv(config);
  console.log("augmented config", augmentedConfig);
  return augmentedConfig;
}
