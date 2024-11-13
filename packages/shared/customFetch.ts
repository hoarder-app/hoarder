import { Agent } from "undici";
import serverConfig from "./config";

// Custom fetch function with configurable timeout
export const customFetch = (input: RequestInfo, init: RequestInit = {}) => {
  const timeout = serverConfig.inference.fetchTimeoutSec * 1000; // Convert to milliseconds
  return fetch(input, {
    ...init,
    dispatcher: new Agent({ headersTimeout: timeout }),
  });
};