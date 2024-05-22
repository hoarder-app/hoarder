import { z } from "zod";

export enum AI_PROVIDERS {
  DISABLED = "disabled",
  OPEN_AI = "OpenAI",
  OLLAMA = "Ollama",
}

export const generalSettingsSchema = z.object({
  disableSignups: z.boolean(),
  maxAssetSize: z.coerce.number().positive(),
  disableNewReleaseCheck: z.boolean(),
});

export const crawlerConfigSchema = z.object({
  downloadBannerImage: z.boolean(),
  storeScreenshot: z.boolean(),
  storeFullPageScreenshot: z.boolean(),
  jobTimeout: z.coerce.number().positive(),
  navigateTimeout: z.coerce.number().positive(),
});

const openAISchema = z.object({
  aiProvider: z.literal(AI_PROVIDERS.OPEN_AI),
  [AI_PROVIDERS.OPEN_AI]: z.object({
    baseURL: z.string().url(),
    apiKey: z.string(),
    inferenceTextModel: z.string(),
    inferenceImageModel: z.string(),
    inferenceLanguage: z.string(),
  }),
});

const ollamaSchema = z.object({
  aiProvider: z.literal(AI_PROVIDERS.OLLAMA),
  [AI_PROVIDERS.OLLAMA]: z.object({
    baseURL: z.string().url(),
    inferenceTextModel: z.string(),
    inferenceImageModel: z.string(),
    inferenceLanguage: z.string(),
  }),
});

const disabledSchema = z.object({
  aiProvider: z.literal(AI_PROVIDERS.DISABLED),
});

export const aiConfigSchema = z.union([
  openAISchema,
  ollamaSchema,
  disabledSchema,
]);

export const dynamicConfigSchema = z.object({
  generalSettings: generalSettingsSchema,
  crawlerConfig: crawlerConfigSchema,
  aiConfig: aiConfigSchema,
});

export const configUpdateSchema = z.object({
  successful: z.boolean(),
});

export type configUpdateSchemaType = z.infer<typeof configUpdateSchema>;
export type dynamicConfigSchemaType = z.infer<typeof dynamicConfigSchema>;
export type generalSettingsSchemaType = z.infer<typeof generalSettingsSchema>;
export type crawlerConfigSchemaType = z.infer<typeof crawlerConfigSchema>;
export type aiConfigSchemaType = z.infer<typeof aiConfigSchema>;

export function createDefaultDynamicConfig(): dynamicConfigSchemaType {
  return {
    generalSettings: {
      disableSignups: false,
      maxAssetSize: 4,
      disableNewReleaseCheck: false,
    },
    crawlerConfig: {
      downloadBannerImage: false,
      storeScreenshot: true,
      storeFullPageScreenshot: false,
      jobTimeout: 60000,
      navigateTimeout: 60000,
    },
    aiConfig: {
      aiProvider: AI_PROVIDERS.DISABLED,
    },
  };
}
