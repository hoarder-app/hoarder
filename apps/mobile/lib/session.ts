import { useCallback } from "react";

import useAppSettings from "./settings";

export function useSession() {
  const { settings, setSettings } = useAppSettings();

  const logout = useCallback(() => {
    setSettings({ ...settings, apiKey: undefined });
  }, [settings, setSettings]);

  return {
    logout,
  };
}

export function useIsLoggedIn() {
  const { settings, isLoading } = useAppSettings();

  return isLoading ? undefined : !!settings.apiKey;
}
