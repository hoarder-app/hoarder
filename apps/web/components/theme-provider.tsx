"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, ThemeProviderProps, useTheme } from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

export function useToggleTheme() {
  const { theme, setTheme } = useTheme();
  if (theme == "dark") {
    return () => setTheme("light");
  } else {
    return () => setTheme("dark");
  }
}
