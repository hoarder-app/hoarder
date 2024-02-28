import { generateApiKey } from "@/server/auth";
import { authedProcedure, router } from "../trpc";
import { z } from "zod";
import { apiKeys } from "@hoarder/db/schema";
import { eq, and } from "drizzle-orm";

export const apiKeysAppRouter = router({
  create: authedProcedure
    .input(
      z.object({
        name: z.string(),
      }),
    )
    .output(
      z.object({
        id: z.string(),
        name: z.string(),
        key: z.string(),
        createdAt: z.date(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return await generateApiKey(input.name, ctx.user.id);
    }),
  revoke: authedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.db
        .delete(apiKeys)
        .where(and(eq(apiKeys.id, input.id), eq(apiKeys.userId, ctx.user.id)));
    }),
  list: authedProcedure
    .output(
      z.object({
        keys: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            createdAt: z.date(),
            keyId: z.string(),
          }),
        ),
      }),
    )
    .query(async ({ ctx }) => {
      const resp = await ctx.db.query.apiKeys.findMany({
        where: eq(apiKeys.userId, ctx.user.id),
        columns: {
          id: true,
          name: true,
          createdAt: true,
          keyId: true,
        },
      });
      return { keys: resp };
    }),
});
