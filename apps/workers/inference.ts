import { Ollama } from "ollama";
import OpenAI from "openai";
import { ChatCompletion } from "openai/resources/chat/completions";

import serverConfig from "@hoarder/shared/config";
import logger from "@hoarder/shared/logger";

export interface InferenceResponse {
  response: string;
  totalTokens: number | undefined;
}

export interface InferenceClient {
  inferFromText(prompt: string): Promise<InferenceResponse>;
  inferFromImage(
    prompt: string,
    contentType: string,
    image: string,
  ): Promise<InferenceResponse>;
}

export class InferenceClientFactory {
  static build(): InferenceClient | null {
    if (serverConfig.inference.openAIApiKey) {
      return new OpenAIInferenceClient();
    }

    if (serverConfig.inference.ollamaBaseUrl) {
      return new OllamaInferenceClient();
    }
    return null;
  }
}

class OpenAIInferenceClient implements InferenceClient {
  openAI: OpenAI;

  constructor() {
    this.openAI = new OpenAI({
      apiKey: serverConfig.inference.openAIApiKey,
      baseURL: serverConfig.inference.openAIBaseUrl,
    });
  }

  /**
   * @param chatCompletion the chatCompletion object or the chatCompletion object as a string (e.g. when using OpenRouter in some occasions)
   * @returns the messageContent extracted out of the chatCompletion object or out of the chatCompletion string
   */
  extractResponse(chatCompletion: ChatCompletion | string): string {
    let response: ChatCompletion;
    if (typeof chatCompletion === "string") {
      response = JSON.parse(chatCompletion) as ChatCompletion;
    } else {
      response = chatCompletion;
    }
    const responseContent = response.choices[0].message.content;
    if (!responseContent) {
      throw new Error(`Got no message content from OpenAI`);
    }
    return responseContent;
  }

  async inferFromText(prompt: string): Promise<InferenceResponse> {
    const chatCompletion = await this.openAI.chat.completions.create({
      messages: [{ role: "system", content: prompt }],
      model: serverConfig.inference.textModel,
      response_format: { type: "json_object" },
    });

    const response = this.extractResponse(chatCompletion);
    return { response, totalTokens: chatCompletion.usage?.total_tokens };
  }

  async inferFromImage(
    prompt: string,
    contentType: string,
    image: string,
  ): Promise<InferenceResponse> {
    const chatCompletion = await this.openAI.chat.completions.create({
      model: serverConfig.inference.imageModel,
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

    const response = this.extractResponse(chatCompletion);
    return { response, totalTokens: chatCompletion.usage?.total_tokens };
  }
}

class OllamaInferenceClient implements InferenceClient {
  ollama: Ollama;

  constructor() {
    this.ollama = new Ollama({
      host: serverConfig.inference.ollamaBaseUrl,
    });
  }

  async runModel(model: string, prompt: string, image?: string) {
    const chatCompletion = await this.ollama.chat({
      model: model,
      format: "json",
      stream: true,
      keep_alive: serverConfig.inference.ollamaKeepAlive,
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
    return await this.runModel(serverConfig.inference.textModel, prompt);
  }

  async inferFromImage(
    prompt: string,
    _contentType: string,
    image: string,
  ): Promise<InferenceResponse> {
    return await this.runModel(
      serverConfig.inference.imageModel,
      prompt,
      image,
    );
  }
}
