import { useEffect, useMemo } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import FullPageSpinner from "@/components/ui/FullPageSpinner";
import { ToastProvider } from "@/components/ui/Toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";

import type { Settings } from "./settings";
import useAppSettings from "./settings";
import { api } from "./trpc";

function getTRPCClient(settings: Settings) {
  return api.createClient({
    links: [
      httpBatchLink({
        url: `${settings.address}/api/trpc`,
        headers() {
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
  const queryClient = useMemo(() => new QueryClient(), [settings]);

  const trpcClient = useMemo(() => getTRPCClient(settings), [settings]);

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>{children}</ToastProvider>
      </QueryClientProvider>
    </api.Provider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const { settings, isLoading, load } = useAppSettings();

  useEffect(() => {
    load();
  }, []);

  if (isLoading) {
    // Don't render anything if the settings still hasn't been loaded
    return <FullPageSpinner />;
  }

  return (
    <SafeAreaProvider>
      <TrpcProvider settings={settings}>
        <ToastProvider>{children}</ToastProvider>
      </TrpcProvider>
    </SafeAreaProvider>
  );
}
