import { createContext, useContext } from "react";

import type { ClientConfig } from "@hoarder/shared/config";

export const ClientConfigCtx = createContext<ClientConfig>({
  demoMode: undefined,
  auth: {
    disableSignups: false,
  },
});

export function useClientConfig() {
  return useContext(ClientConfigCtx);
}
