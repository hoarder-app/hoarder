import { z } from "zod";

export enum AI_PROVIDER {
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

const openAiConfigSchema = z.object({
  baseURL: z.string().url(),
  apiKey: z.string(),
  inferenceTextModel: z.string(),
  inferenceImageModel: z.string(),
  inferenceLanguage: z.string(),
});

const openAISchema = z.object({
  aiProvider: z.literal(AI_PROVIDER.OPEN_AI),
  [AI_PROVIDER.OPEN_AI]: openAiConfigSchema,
});

const ollamaConfigSchema = z.object({
  baseURL: z.string().url(),
  inferenceTextModel: z.string(),
  inferenceImageModel: z.string(),
  inferenceLanguage: z.string(),
});

const ollamaSchema = z.object({
  aiProvider: z.literal(AI_PROVIDER.OLLAMA),
  [AI_PROVIDER.OLLAMA]: ollamaConfigSchema,
});

const disabledSchema = z.object({
  aiProvider: z.literal(AI_PROVIDER.DISABLED),
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
export type openAIConfigSchemaType = z.infer<typeof openAiConfigSchema>;
export type ollamaConfigSchemaType = z.infer<typeof ollamaConfigSchema>;

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
      aiProvider: AI_PROVIDER.DISABLED,
    },
  };
}
