import { Ollama } from "ollama";
import OpenAI from "openai";

import serverConfig from "@hoarder/shared/config";

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

  async inferFromText(prompt: string): Promise<InferenceResponse> {
    const chatCompletion = await this.openAI.chat.completions.create({
      messages: [{ role: "system", content: prompt }],
      model: serverConfig.inference.textModel,
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
      model: serverConfig.inference.imageModel,
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

  constructor() {
    this.ollama = new Ollama({
      host: serverConfig.inference.ollamaBaseUrl,
    });
  }

  async inferFromText(prompt: string): Promise<InferenceResponse> {
    const chatCompletion = await this.ollama.chat({
      model: serverConfig.inference.textModel,
      format: "json",
      messages: [{ role: "system", content: prompt }],
    });

    const response = chatCompletion.message.content;

    return { response, totalTokens: chatCompletion.eval_count };
  }

  async inferFromImage(
    prompt: string,
    _contentType: string,
    image: string,
  ): Promise<InferenceResponse> {
    const chatCompletion = await this.ollama.chat({
      model: serverConfig.inference.imageModel,
      format: "json",
      messages: [{ role: "user", content: prompt, images: [`${image}`] }],
    });

    const response = chatCompletion.message.content;
    return { response, totalTokens: chatCompletion.eval_count };
  }
}
