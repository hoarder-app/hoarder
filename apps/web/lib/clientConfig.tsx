import { createContext, useContext } from "react";

import type { ClientConfig } from "@karakeep/shared/config";

export const ClientConfigCtx = createContext<ClientConfig>({
  demoMode: undefined,
  auth: {
    disableSignups: false,
    disablePasswordAuth: false,
  },
  inference: {
    inferredTagLang: "english",
  },
  serverVersion: undefined,
  disableNewReleaseCheck: true,
});

export function useClientConfig() {
  return useContext(ClientConfigCtx);
}
