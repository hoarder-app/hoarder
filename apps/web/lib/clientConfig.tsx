import { createContext, useContext } from "react";

import type { ClientConfig } from "@hoarder/shared/config";

export const ClientConfigCtx = createContext<ClientConfig>({
  demoMode: undefined,
  serverVersion: undefined,
  disableNewReleaseCheck: true,
});

export function useClientConfig() {
  return useContext(ClientConfigCtx);
}
