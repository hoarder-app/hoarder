import { createTRPCReact } from "@trpc/react-query";

import type { AppRouter } from "@hoarder/trpc/routers/_app";

export const api = createTRPCReact<AppRouter>();
