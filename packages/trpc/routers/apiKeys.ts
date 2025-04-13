import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { apiKeys } from "@karakeep/db/schema";
import serverConfig from "@karakeep/shared/config";

import {
  authenticateApiKey,
  generateApiKey,
  logAuthenticationError,
  validatePassword,
} from "../auth";
import { authedProcedure, publicProcedure, router } from "../index";

const zApiKeySchema = z.object({
  id: z.string(),
  name: z.string(),
  key: z.string(),
  createdAt: z.date(),
});

export const apiKeysAppRouter = router({
  create: authedProcedure
    .input(
      z.object({
        name: z.string(),
      }),
    )
    .output(zApiKeySchema)
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
  // Exchange the username and password with an API key.
  // Homemade oAuth. This is used by the extension.
  exchange: publicProcedure
    .input(
      z.object({
        keyName: z.string(),
        email: z.string(),
        password: z.string(),
      }),
    )
    .output(zApiKeySchema)
    .mutation(async ({ input, ctx }) => {
      let user;
      // Special handling as otherwise the extension would show "username or password is wrong"
      if (serverConfig.auth.disablePasswordAuth) {
        throw new TRPCError({
          message: "Password authentication is currently disabled",
          code: "FORBIDDEN",
        });
      }
      try {
        user = await validatePassword(input.email, input.password);
      } catch (e) {
        const error = e as Error;
        logAuthenticationError(input.email, error.message, ctx.req.ip);
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return await generateApiKey(input.keyName, user.id);
    }),
  validate: publicProcedure
    .input(z.object({ apiKey: z.string() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      try {
        await authenticateApiKey(input.apiKey); // Throws if the key is invalid
        return {
          success: true,
        };
      } catch (e) {
        const error = e as Error;
        logAuthenticationError("<unknown>", error.message, ctx.req.ip);
        throw e;
      }
    }),
});
