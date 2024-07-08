import { z } from "zod";

import {
  ConfigType,
  ConfigValue,
  InferenceProviderEnum,
  InferenceProviderEnumValidator,
} from "./configValue";

export const SectionSymbol = Symbol("section");

export interface SectionInformation {
  name: string;
}

export interface ConfigSubSection {
  [SectionSymbol]: SectionInformation;
  [configValue: string]: ConfigValue<ConfigType>;
}

export type ServerConfig = Record<string, ConfigSubSection>;

export const serverConfig: ServerConfig = {
  generalConfig: {
    [SectionSymbol]: {
      name: "General",
    },
    disableSignups: new ConfigValue({
      key: "DISABLE_SIGNUPS",
      name: "Disable Signups",
      type: ConfigType.BOOLEAN,
      defaultValue: false,
      validator: z.boolean(),
    }),
    maxAssetSize: new ConfigValue({
      key: "MAX_ASSET_SIZE_MB",
      name: "Maximum Asset size(MB)",
      type: ConfigType.NUMBER,
      defaultValue: 4,
      validator: z.number().positive(),
    }),
    disableNewReleaseCheck: new ConfigValue({
      key: "DISABLE_NEW_RELEASE_CHECK",
      name: "Disable new release check",
      type: ConfigType.BOOLEAN,
      defaultValue: false,
      validator: z.boolean(),
    }),
  },
  crawlerConfig: {
    [SectionSymbol]: {
      name: "Crawler",
    },
    downloadBannerImage: new ConfigValue({
      key: "CRAWLER_DOWNLOAD_BANNER_IMAGE",
      name: "Download Banner Image",
      type: ConfigType.BOOLEAN,
      defaultValue: true,
      validator: z.boolean(),
    }),
    storeScreenshot: new ConfigValue({
      key: "CRAWLER_STORE_SCREENSHOT",
      name: "Disable screenshots",
      type: ConfigType.BOOLEAN,
      defaultValue: true,
      validator: z.boolean(),
    }),
    storeFullPageScreenshot: new ConfigValue({
      key: "CRAWLER_FULL_PAGE_SCREENSHOT",
      name: "Store full page screenshots",
      type: ConfigType.BOOLEAN,
      defaultValue: false,
      validator: z.boolean(),
    }),
    fullPageArchive: new ConfigValue({
      key: "CRAWLER_FULL_PAGE_ARCHIVE",
      name: "Store full page archive",
      type: ConfigType.BOOLEAN,
      defaultValue: false,
      validator: z.boolean(),
    }),
    jobTimeout: new ConfigValue({
      key: "CRAWLER_JOB_TIMEOUT_SEC",
      name: "Job Timeout (sec)",
      type: ConfigType.NUMBER,
      defaultValue: 60,
      validator: z.number().positive(),
    }),
    navigateTimeout: new ConfigValue({
      key: "CRAWLER_NAVIGATE_TIMEOUT_SEC",
      name: "Navigate Timeout (sec)",
      type: ConfigType.NUMBER,
      defaultValue: 30,
      validator: z.number().positive(),
    }),
  },
  inferenceConfig: {
    [SectionSymbol]: {
      name: "Inference Config",
    },
    inferenceProvider: new ConfigValue({
      key: "INFERENCE_PROVIDER",
      name: "Inference Provider",
      type: ConfigType.INFERENCE_PROVIDER_ENUM,
      defaultValue: InferenceProviderEnum.DISABLED,
      validator: InferenceProviderEnumValidator,
    }),
    openApiKey: new ConfigValue({
      key: "OPENAI_API_KEY",
      name: "OpenAPI Key",
      type: ConfigType.PASSWORD,
      defaultValue: "",
      validator: z.string(),
    }),
    openAiBaseUrl: new ConfigValue({
      key: "OPENAI_BASE_URL",
      name: "OpenAPI base URL",
      type: ConfigType.STRING,
      defaultValue: "",
      validator: z.string(),
    }),
    ollamaBaseUrl: new ConfigValue({
      key: "OLLAMA_BASE_URL",
      name: "Ollama base URL",
      type: ConfigType.STRING,
      defaultValue: "",
      validator: z.string(),
    }),
    inferenceTextModel: new ConfigValue({
      key: "INFERENCE_TEXT_MODEL",
      name: "Inference text model",
      type: ConfigType.STRING,
      defaultValue: "gpt-3.5-turbo-0125",
      validator: z.string(),
    }),
    inferenceImageModel: new ConfigValue({
      key: "INFERENCE_IMAGE_MODEL",
      name: "Inference image model",
      type: ConfigType.STRING,
      defaultValue: "gpt-4o-2024-05-13",
      validator: z.string(),
    }),
    inferenceLanguage: new ConfigValue({
      key: "INFERENCE_LANG",
      name: "Inference language",
      type: ConfigType.STRING,
      defaultValue: "english",
      validator: z.string(),
    }),
  },
};
