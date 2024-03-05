import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useCallback, useEffect, useState } from "react";
import { api } from "./trpc";
import usePluginSettings from "./settings";
import superjson from "superjson";

export function Providers({ children }: { children: React.ReactNode }) {
  const [settings] = usePluginSettings();
  const [queryClient] = useState(() => new QueryClient());

  const getTrpcClient = useCallback(() => {
    return api.createClient({
      links: [
        httpBatchLink({
          url: `${settings.address}/api/trpc`,
          headers() {
            return {
              Authorization: `Bearer ${settings.apiKey}`,
            };
          },
          transformer: superjson,
        }),
      ],
    });
  }, [settings]);

  const [trpcClient, setTrpcClient] = useState(getTrpcClient());

  useEffect(() => {
    setTrpcClient(getTrpcClient());
  }, [getTrpcClient]);

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </api.Provider>
  );
}
