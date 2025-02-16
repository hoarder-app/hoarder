import serverConfig from "./config";

// Custom fetch function with configurable timeout
export function customFetch(
  input: Parameters<typeof fetch>[0],
  init?: Parameters<typeof fetch>[1],
): ReturnType<typeof fetch> {
  const timeout = serverConfig.inference.fetchTimeoutSec * 1000; // Convert to milliseconds
  return fetch(input, {
    signal: AbortSignal.timeout(timeout),
    ...init,
  });
}
