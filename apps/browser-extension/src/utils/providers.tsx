import { TRPCProvider } from "@hoarder/shared-react/providers/trpc-provider";

import usePluginSettings from "./settings";

export function Providers({ children }: { children: React.ReactNode }) {
  const { settings } = usePluginSettings();

  return <TRPCProvider settings={settings}>{children}</TRPCProvider>;
}
