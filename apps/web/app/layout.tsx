import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "@hoarder/tailwind-config/globals.css";

import type { Viewport } from "next";
import React from "react";
import { cookies } from "next/headers";
import { Toaster } from "@/components/ui/toaster";
import Providers from "@/lib/providers";
import {
  defaultUserLocalSettings,
  parseUserLocalSettings,
  USER_LOCAL_SETTINGS_COOKIE_NAME,
} from "@/lib/userLocalSettings/types";
import { getServerAuthSession } from "@/server/auth";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { clientConfig } from "@hoarder/shared/config";

const inter = Inter({
  subsets: ["latin"],
  fallback: ["sans-serif"],
});

export const metadata: Metadata = {
  title: "Hoarder",
  applicationName: "Hoarder",
  description:
    "The Bookmark Everything app. Hoard links, notes, and images and they will get automatically tagged AI.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Hoarder",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerAuthSession();
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers
          session={session}
          clientConfig={clientConfig}
          userLocalSettings={
            parseUserLocalSettings(
              cookies().get(USER_LOCAL_SETTINGS_COOKIE_NAME)?.value,
            ) ?? defaultUserLocalSettings()
          }
        >
          {children}
          <ReactQueryDevtools initialIsOpen={false} />
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
