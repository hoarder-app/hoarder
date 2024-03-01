"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useState } from "react";
import { api } from "./trpc";
import { loggerLink } from "@trpc/client";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { SessionProvider } from "next-auth/react";
import { Session } from "next-auth";

export default function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  const [queryClient] = React.useState(() => new QueryClient());

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        loggerLink({
          enabled: (op) =>
            process.env.NODE_ENV === "development" ||
            (op.direction === "down" && op.result instanceof Error),
        }),
        httpBatchLink({
          // TODO: Change this to be a full URL exposed as a client side setting
          url: `/api/trpc`,
          transformer: superjson,
        }),
      ],
    }),
  );

  return (
    <SessionProvider session={session}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </api.Provider>
    </SessionProvider>
  );
}
