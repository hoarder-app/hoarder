import { useEffect, useState } from "react";
import FullPageSpinner from "@/components/ui/FullPageSpinner";
import { ToastProvider } from "@/components/ui/Toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";

import type { Settings } from "./settings";
import useAppSettings, { getAppSettings } from "./settings";
import { api } from "./trpc";

function getTRPCClient(address: string) {
  return api.createClient({
    links: [
      httpBatchLink({
        url: `${address}/api/trpc`,
        async headers() {
          const settings = await getAppSettings();
          return {
            Authorization: settings?.apiKey
              ? `Bearer ${settings.apiKey}`
              : undefined,
          };
        },
        transformer: superjson,
      }),
    ],
  });
}

function TrpcProvider({
  children,
  settings,
}: {
  settings: Settings;
  children: React.ReactNode;
}) {
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
      <QueryClientProvider client={queryClient}>
        <ToastProvider>{children}</ToastProvider>
      </QueryClientProvider>
    </api.Provider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const { settings, isLoading } = useAppSettings();

  if (isLoading) {
    // Don't render anything if the settings still hasn't been loaded
    return <FullPageSpinner />;
  }

  return (
    <TrpcProvider settings={settings}>
      <ToastProvider>{children}</ToastProvider>
    </TrpcProvider>
  );
}
