import { Ollama } from "ollama";
import OpenAI from "openai";

import logger from "@hoarder/shared/logger";
import {
  AI_PROVIDER,
  dynamicConfigSchemaType,
  ollamaConfigSchemaType,
  openAIConfigSchemaType,
} from "@hoarder/shared/types/admin";

export interface InferenceResponse {
  response: string;
  totalTokens: number | undefined;
}

export interface InferenceClient {
  getInferredTagLang(): string;
  inferFromText(prompt: string): Promise<InferenceResponse>;
  inferFromImage(
    prompt: string,
    contentType: string,
    image: string,
  ): Promise<InferenceResponse>;
}

export class InferenceClientFactory {
  static build(dynamicConfig: dynamicConfigSchemaType): InferenceClient | null {
    if (dynamicConfig.aiConfig.aiProvider === AI_PROVIDER.OPEN_AI) {
      return new OpenAIInferenceClient(
        dynamicConfig.aiConfig[AI_PROVIDER.OPEN_AI],
      );
    }

    if (dynamicConfig.aiConfig.aiProvider === AI_PROVIDER.OLLAMA) {
      return new OllamaInferenceClient(
        dynamicConfig.aiConfig[AI_PROVIDER.OLLAMA],
      );
    }
    return null;
  }
}

class OpenAIInferenceClient implements InferenceClient {
  openAI: OpenAI;
  openAiConfig: openAIConfigSchemaType;

  constructor(config: openAIConfigSchemaType) {
    this.openAiConfig = config;
    this.openAI = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    });
  }

  getInferredTagLang(): string {
    return this.openAiConfig.inferenceLanguage;
  }

  async inferFromText(prompt: string): Promise<InferenceResponse> {
    const chatCompletion = await this.openAI.chat.completions.create({
      messages: [{ role: "system", content: prompt }],
      model: this.openAiConfig.inferenceTextModel,
      response_format: { type: "json_object" },
    });

    const response = chatCompletion.choices[0].message.content;
    if (!response) {
      throw new Error(`Got no message content from OpenAI`);
    }
    return { response, totalTokens: chatCompletion.usage?.total_tokens };
  }

  async inferFromImage(
    prompt: string,
    contentType: string,
    image: string,
  ): Promise<InferenceResponse> {
    const chatCompletion = await this.openAI.chat.completions.create({
      model: this.openAiConfig.inferenceImageModel,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:${contentType};base64,${image}`,
                detail: "low",
              },
            },
          ],
        },
      ],
      max_tokens: 2000,
    });

    const response = chatCompletion.choices[0].message.content;
    if (!response) {
      throw new Error(`Got no message content from OpenAI`);
    }
    return { response, totalTokens: chatCompletion.usage?.total_tokens };
  }
}

class OllamaInferenceClient implements InferenceClient {
  ollama: Ollama;
  ollamaConfig: ollamaConfigSchemaType;

  constructor(config: ollamaConfigSchemaType) {
    this.ollama = new Ollama({
      host: config.baseURL,
    });
    this.ollamaConfig = config;
  }

  getInferredTagLang(): string {
    return this.ollamaConfig.inferenceLanguage;
  }

  async runModel(model: string, prompt: string, image?: string) {
    const chatCompletion = await this.ollama.chat({
      model: model,
      format: "json",
      stream: true,
      messages: [
        { role: "user", content: prompt, images: image ? [image] : undefined },
      ],
    });

    let totalTokens = 0;
    let response = "";
    try {
      for await (const part of chatCompletion) {
        response += part.message.content;
        if (!isNaN(part.eval_count)) {
          totalTokens += part.eval_count;
        }
        if (!isNaN(part.prompt_eval_count)) {
          totalTokens += part.prompt_eval_count;
        }
      }
    } catch (e) {
      // There seem to be some bug in ollama where you can get some successfull response, but still throw an error.
      // Using stream + accumulating the response so far is a workaround.
      // https://github.com/ollama/ollama-js/issues/72
      totalTokens = NaN;
      logger.warn(
        `Got an exception from ollama, will still attempt to deserialize the response we got so far: ${e}`,
      );
    }

    return { response, totalTokens };
  }

  async inferFromText(prompt: string): Promise<InferenceResponse> {
    return await this.runModel(this.ollamaConfig.inferenceTextModel, prompt);
  }

  async inferFromImage(
    prompt: string,
    _contentType: string,
    image: string,
  ): Promise<InferenceResponse> {
    return await this.runModel(
      this.ollamaConfig.inferenceImageModel,
      prompt,
      image,
    );
  }
}
