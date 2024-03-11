import { useCallback, useMemo } from "react";

import useAppSettings from "./settings";

export function useSession() {
  const { settings, isLoading, setSettings } = useAppSettings();
  const isLoggedIn = useMemo(() => {
    return isLoading ? undefined : !!settings.apiKey;
  }, [isLoading, settings]);

  const logout = useCallback(() => {
    setSettings({ ...settings, apiKey: undefined });
  }, [settings]);

  return {
    isLoggedIn,
    isLoading,
    logout,
  };
}
