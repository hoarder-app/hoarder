import { experimental_trpcMiddleware, TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { webhooksTable } from "@karakeep/db/schema";
import {
  zNewWebhookSchema,
  zUpdateWebhookSchema,
  zWebhookSchema,
} from "@karakeep/shared/types/webhooks";

import { authedProcedure, Context, router } from "../index";

function adaptWebhook(webhook: typeof webhooksTable.$inferSelect) {
  const { token, ...rest } = webhook;
  return {
    ...rest,
    hasToken: token !== null,
  };
}

export const ensureWebhookOwnership = experimental_trpcMiddleware<{
  ctx: Context;
  input: { webhookId: string };
}>().create(async (opts) => {
  const webhook = await opts.ctx.db.query.webhooksTable.findFirst({
    where: eq(webhooksTable.id, opts.input.webhookId),
    columns: {
      userId: true,
    },
  });
  if (!opts.ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "User is not authorized",
    });
  }
  if (!webhook) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Webhook not found",
    });
  }
  if (webhook.userId != opts.ctx.user.id) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "User is not allowed to access resource",
    });
  }

  return opts.next();
});

export const webhooksAppRouter = router({
  create: authedProcedure
    .input(zNewWebhookSchema)
    .output(zWebhookSchema)
    .mutation(async ({ input, ctx }) => {
      const [webhook] = await ctx.db
        .insert(webhooksTable)
        .values({
          url: input.url,
          events: input.events,
          token: input.token ?? null,
          userId: ctx.user.id,
        })
        .returning();

      return adaptWebhook(webhook);
    }),
  update: authedProcedure
    .input(zUpdateWebhookSchema)
    .output(zWebhookSchema)
    .use(ensureWebhookOwnership)
    .mutation(async ({ input, ctx }) => {
      const webhook = await ctx.db
        .update(webhooksTable)
        .set({
          url: input.url,
          events: input.events,
          token: input.token,
        })
        .where(
          and(
            eq(webhooksTable.userId, ctx.user.id),
            eq(webhooksTable.id, input.webhookId),
          ),
        )
        .returning();
      if (webhook.length == 0) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return adaptWebhook(webhook[0]);
    }),
  list: authedProcedure
    .output(z.object({ webhooks: z.array(zWebhookSchema) }))
    .query(async ({ ctx }) => {
      const webhooks = await ctx.db.query.webhooksTable.findMany({
        where: eq(webhooksTable.userId, ctx.user.id),
      });
      return { webhooks: webhooks.map(adaptWebhook) };
    }),
  delete: authedProcedure
    .input(
      z.object({
        webhookId: z.string(),
      }),
    )
    .use(ensureWebhookOwnership)
    .mutation(async ({ input, ctx }) => {
      const res = await ctx.db
        .delete(webhooksTable)
        .where(
          and(
            eq(webhooksTable.userId, ctx.user.id),
            eq(webhooksTable.id, input.webhookId),
          ),
        );
      if (res.changes == 0) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
    }),
});
