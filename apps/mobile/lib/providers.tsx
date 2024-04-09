import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import FullPageSpinner from "@/components/ui/FullPageSpinner";
import { ToastProvider } from "@/components/ui/Toast";

import { TRPCProvider } from "@hoarder/shared-react/providers/trpc-provider";

import useAppSettings from "./settings";

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
      <TRPCProvider settings={settings}>
        <ToastProvider>{children}</ToastProvider>
      </TRPCProvider>
    </SafeAreaProvider>
  );
}
