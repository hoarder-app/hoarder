"use client";
import type { AppRouter } from "@hoarder/trpc/routers/_app";
import { createTRPCReact } from "@trpc/react-query";

export const api = createTRPCReact<AppRouter>();
