import { createContext, useContext } from "react";

import type { ClientConfig } from "@hoarder/shared/config";

export const ClientConfigCtx = createContext<ClientConfig>({
  demoMode: undefined,
  auth: {
    disableSignups: false,
  },
  serverVersion: undefined,
  disableNewReleaseCheck: true,
});

export function useClientConfig() {
  return useContext(ClientConfigCtx);
}
