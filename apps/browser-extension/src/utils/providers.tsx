import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useEffect, useState } from "react";
import { api } from "./trpc";
import usePluginSettings, { getPluginSettings } from "./settings";
import superjson from "superjson";

function getTRPCClient(address: string) {
  return api.createClient({
    links: [
      httpBatchLink({
        url: `${address}/api/trpc`,
        async headers() {
          const settings = await getPluginSettings();
          return {
            Authorization: `Bearer ${settings.apiKey}`,
          };
        },
        transformer: superjson,
      }),
    ],
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  const { settings } = usePluginSettings();
  const [queryClient] = useState(() => new QueryClient());

  const [trpcClient, setTrpcClient] = useState<
    ReturnType<typeof getTRPCClient>
  >(getTRPCClient(settings.address));

  useEffect(() => {
    setTrpcClient(getTRPCClient(settings.address));
  }, [settings.address]);

  return (
    <api.Provider
      key={settings.address}
      client={trpcClient}
      queryClient={queryClient}
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </api.Provider>
  );
}
