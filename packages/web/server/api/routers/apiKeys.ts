import { generateApiKey } from "@/server/auth";
import { authedProcedure, router } from "../trpc";
import { prisma } from "@remember/db";
import { z } from "zod";

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
    .output(z.object({}))
    .mutation(async ({ input, ctx }) => {
      const resp = await prisma.apiKey.delete({
        where: {
          id: input.id,
          userId: ctx.user.id,
        },
      });
      return resp;
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
      const resp = await prisma.apiKey.findMany({
        where: {
          userId: ctx.user.id,
        },
        select: {
          id: true,
          name: true,
          createdAt: true,
          keyId: true,
        },
      });
      return { keys: resp };
    }),
});
