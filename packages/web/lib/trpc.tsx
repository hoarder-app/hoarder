"use client";
import type { AppRouter } from "@/server/api/routers/_app";
import { createTRPCReact } from "@trpc/react-query";

export const api = createTRPCReact<AppRouter>();
