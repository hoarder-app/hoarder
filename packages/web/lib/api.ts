"use client";

import { ZodTypeAny, z } from "zod";
import {
  ZNewBookmarkedLinkRequest,
  zGetLinksResponseSchema,
} from "./types/api/links";

import serverConfig from "./config";

const BASE_URL = `${serverConfig.api_url}/api/v1`;

export type FetchError = {
  status?: number;
  message?: string;
};

type InputSchema<T> = T extends ZodTypeAny ? T : undefined;

async function doRequest<T>(
  path: string,
  respSchema?: InputSchema<T>,
  opts?: RequestInit,
): Promise<
  | (InputSchema<T> extends ZodTypeAny
      ? [z.infer<InputSchema<T>>, undefined]
      : [undefined, undefined])
  | [undefined, FetchError]
> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, opts);
    if (!res.ok) {
      return [
        undefined,
        { status: res.status, message: await res.text() },
      ] as const;
    }
    if (!respSchema) {
      return [undefined, undefined] as const;
    }

    let parsed = respSchema.safeParse(await res.json());
    if (!parsed.success) {
      return [
        undefined,
        { message: `Failed to parse response: ${parsed.error.toString()}` },
      ] as const;
    }

    return [parsed.data, undefined] as const;
  } catch (error: any) {
    return [
      undefined,
      { message: `Failed to execute fetch request: ${error}` },
    ] as const;
  }
}

export default class APIClient {
  static async getLinks() {
    return await doRequest(`/links`, zGetLinksResponseSchema, {
      next: { tags: ["links"] },
    });
  }

  static async bookmarkLink(url: string) {
    const body: ZNewBookmarkedLinkRequest = {
      url,
    };
    return await doRequest(`/links`, undefined, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  static async unbookmarkLink(linkId: string) {
    return await doRequest(`/links/${linkId}`, undefined, {
      method: "DELETE",
    });
  }
}
