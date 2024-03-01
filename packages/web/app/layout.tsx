import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import Providers from "@/lib/providers";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { getServerAuthSession } from "@/server/auth";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hoarder",
  description: "Your AI powered second brain",
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
        <Providers session={session}>
          {children}
          <ReactQueryDevtools initialIsOpen={false} />
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
