import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "@hoarder/tailwind-config/globals.css";

import React from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hoarder",
  metadataBase: new URL("https://hoarder.app"),
  description:
    "The Bookmark Everything app. Hoard links, notes, and images and they will get automatically tagged AI.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
