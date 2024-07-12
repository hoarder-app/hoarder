import { z } from "zod";

import { ConfigType, ConfigValue, InferenceProviderEnum } from "./configValue";

export const SectionSymbol = Symbol("section");

export interface SectionInformation {
  name: string;
}

export interface ConfigSubSection {
  [SectionSymbol]: SectionInformation;
  [configValue: string]: ConfigValue<ConfigType>;
}

export enum ConfigSectionName {
  GENERAL_CONFIG = "generalConfig",
  CRAWLER_CONFIG = "crawlerConfig",
  INFERENCE_CONFIG = "inferenceConfig",
}

export enum ConfigKeys {
  DISABLE_SIGNUPS = "DISABLE_SIGNUPS",
  MAX_ASSET_SIZE_MB = "MAX_ASSET_SIZE_MB",
  DISABLE_NEW_RELEASE_CHECK = "DISABLE_NEW_RELEASE_CHECK",
  CRAWLER_DOWNLOAD_BANNER_IMAGE = "CRAWLER_DOWNLOAD_BANNER_IMAGE",
  CRAWLER_STORE_SCREENSHOT = "CRAWLER_STORE_SCREENSHOT",
  CRAWLER_FULL_PAGE_SCREENSHOT = "CRAWLER_FULL_PAGE_SCREENSHOT",
  CRAWLER_FULL_PAGE_ARCHIVE = "CRAWLER_FULL_PAGE_ARCHIVE",
  CRAWLER_JOB_TIMEOUT_SEC = "CRAWLER_JOB_TIMEOUT_SEC",
  CRAWLER_NAVIGATE_TIMEOUT_SEC = "CRAWLER_NAVIGATE_TIMEOUT_SEC",
  INFERENCE_PROVIDER = "INFERENCE_PROVIDER",
  OPENAI_API_KEY = "OPENAI_API_KEY",
  OPENAI_BASE_URL = "OPENAI_BASE_URL",
  OLLAMA_BASE_URL = "OLLAMA_BASE_URL",
  INFERENCE_TEXT_MODEL = "INFERENCE_TEXT_MODEL",
  INFERENCE_IMAGE_MODEL = "INFERENCE_IMAGE_MODEL",
  INFERENCE_LANG = "INFERENCE_LANG",
}

export type ServerConfig = Record<ConfigSectionName, ConfigSubSection>;

export const serverConfig: ServerConfig = {
  [ConfigSectionName.GENERAL_CONFIG]: {
    [SectionSymbol]: {
      name: "General Config",
    },
    [ConfigKeys.DISABLE_SIGNUPS]: new ConfigValue({
      key: ConfigKeys.DISABLE_SIGNUPS,
      name: "Disable Signups",
      type: ConfigType.BOOLEAN,
      defaultValue: false,
      validator: z.boolean(),
    }),
    [ConfigKeys.MAX_ASSET_SIZE_MB]: new ConfigValue({
      key: ConfigKeys.MAX_ASSET_SIZE_MB,
      name: "Maximum Asset size(MB)",
      type: ConfigType.NUMBER,
      defaultValue: 4,
      validator: z.coerce.number().positive(),
    }),
    [ConfigKeys.DISABLE_NEW_RELEASE_CHECK]: new ConfigValue({
      key: ConfigKeys.DISABLE_NEW_RELEASE_CHECK,
      name: "Disable new release check",
      type: ConfigType.BOOLEAN,
      defaultValue: false,
      validator: z.boolean(),
    }),
  },
  [ConfigSectionName.CRAWLER_CONFIG]: {
    [SectionSymbol]: {
      name: "Crawler Config",
    },
    [ConfigKeys.CRAWLER_DOWNLOAD_BANNER_IMAGE]: new ConfigValue({
      key: ConfigKeys.CRAWLER_DOWNLOAD_BANNER_IMAGE,
      name: "Download Banner Image",
      type: ConfigType.BOOLEAN,
      defaultValue: true,
      validator: z.boolean(),
    }),
    [ConfigKeys.CRAWLER_STORE_SCREENSHOT]: new ConfigValue({
      key: ConfigKeys.CRAWLER_STORE_SCREENSHOT,
      name: "Disable screenshots",
      type: ConfigType.BOOLEAN,
      defaultValue: true,
      validator: z.boolean(),
    }),
    [ConfigKeys.CRAWLER_FULL_PAGE_SCREENSHOT]: new ConfigValue({
      key: ConfigKeys.CRAWLER_FULL_PAGE_SCREENSHOT,
      name: "Store full page screenshots",
      type: ConfigType.BOOLEAN,
      defaultValue: false,
      validator: z.boolean(),
      dependsOn: [ConfigKeys.CRAWLER_STORE_SCREENSHOT],
      renderIf: (value) => {
        return !!value;
      },
    }),
    [ConfigKeys.CRAWLER_FULL_PAGE_ARCHIVE]: new ConfigValue({
      key: ConfigKeys.CRAWLER_FULL_PAGE_ARCHIVE,
      name: "Store full page archive",
      type: ConfigType.BOOLEAN,
      defaultValue: false,
      validator: z.boolean(),
    }),
    [ConfigKeys.CRAWLER_JOB_TIMEOUT_SEC]: new ConfigValue({
      key: ConfigKeys.CRAWLER_JOB_TIMEOUT_SEC,
      name: "Job Timeout (sec)",
      type: ConfigType.NUMBER,
      defaultValue: 60,
      validator: z.coerce.number().positive(),
    }),
    [ConfigKeys.CRAWLER_NAVIGATE_TIMEOUT_SEC]: new ConfigValue({
      key: ConfigKeys.CRAWLER_NAVIGATE_TIMEOUT_SEC,
      name: "Navigate Timeout (sec)",
      type: ConfigType.NUMBER,
      defaultValue: 30,
      validator: z.coerce.number().positive(),
    }),
  },
  [ConfigSectionName.INFERENCE_CONFIG]: {
    [SectionSymbol]: {
      name: "Inference Config",
    },
    [ConfigKeys.INFERENCE_PROVIDER]: new ConfigValue({
      key: ConfigKeys.INFERENCE_PROVIDER,
      name: "Inference Provider",
      type: ConfigType.INFERENCE_PROVIDER_ENUM,
      defaultValue: InferenceProviderEnum.DISABLED,
      validator: [
        z.literal(InferenceProviderEnum.DISABLED),
        z.literal(InferenceProviderEnum.OPEN_AI),
        z.literal(InferenceProviderEnum.OLLAMA),
      ],
    }),
    [ConfigKeys.OPENAI_API_KEY]: new ConfigValue({
      key: ConfigKeys.OPENAI_API_KEY,
      name: "OpenAPI Key",
      type: ConfigType.PASSWORD,
      defaultValue: "",
      validator: z.string(),
      dependsOn: [ConfigKeys.INFERENCE_PROVIDER],
      renderIf: (value) => {
        return value === InferenceProviderEnum.OPEN_AI;
      },
    }),
    [ConfigKeys.OPENAI_BASE_URL]: new ConfigValue({
      key: ConfigKeys.OPENAI_BASE_URL,
      name: "OpenAPI base URL",
      type: ConfigType.URL,
      defaultValue: "",
      validator: z.string().url(),
      dependsOn: [ConfigKeys.INFERENCE_PROVIDER],
      renderIf: (value) => {
        return value === InferenceProviderEnum.OPEN_AI;
      },
    }),
    [ConfigKeys.OLLAMA_BASE_URL]: new ConfigValue({
      key: ConfigKeys.OLLAMA_BASE_URL,
      name: "Ollama base URL",
      type: ConfigType.URL,
      defaultValue: "",
      validator: z.string().url(),
      dependsOn: [ConfigKeys.INFERENCE_PROVIDER],
      renderIf: (value) => {
        return value === InferenceProviderEnum.OLLAMA;
      },
    }),
    [ConfigKeys.INFERENCE_TEXT_MODEL]: new ConfigValue({
      key: ConfigKeys.INFERENCE_TEXT_MODEL,
      name: "Inference text model",
      type: ConfigType.STRING,
      defaultValue: "gpt-3.5-turbo-0125",
      validator: z.string().min(1),
      dependsOn: [ConfigKeys.INFERENCE_PROVIDER],
      renderIf: (value) => {
        return value !== InferenceProviderEnum.DISABLED;
      },
    }),
    [ConfigKeys.INFERENCE_IMAGE_MODEL]: new ConfigValue({
      key: ConfigKeys.INFERENCE_IMAGE_MODEL,
      name: "Inference image model",
      type: ConfigType.STRING,
      defaultValue: "gpt-4o-2024-05-13",
      validator: z.string().min(1),
      dependsOn: [ConfigKeys.INFERENCE_PROVIDER],
      renderIf: (value) => {
        return value !== InferenceProviderEnum.DISABLED;
      },
    }),
    [ConfigKeys.INFERENCE_LANG]: new ConfigValue({
      key: ConfigKeys.INFERENCE_LANG,
      name: "Inference language",
      type: ConfigType.STRING,
      defaultValue: "english",
      validator: z.string().min(1),
      dependsOn: [ConfigKeys.INFERENCE_PROVIDER],
      renderIf: (value) => {
        return value !== InferenceProviderEnum.DISABLED;
      },
    }),
  },
};
