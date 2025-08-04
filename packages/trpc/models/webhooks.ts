import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { webhooksTable } from "@karakeep/db/schema";
import {
  zNewWebhookSchema,
  zUpdateWebhookSchema,
  zWebhookSchema,
} from "@karakeep/shared/types/webhooks";

import { AuthedContext } from "..";
import { PrivacyAware } from "./privacy";

export class Webhook implements PrivacyAware {
  constructor(
    protected ctx: AuthedContext,
    public webhook: typeof webhooksTable.$inferSelect,
  ) {}

  static async fromId(ctx: AuthedContext, id: string): Promise<Webhook> {
    const webhook = await ctx.db.query.webhooksTable.findFirst({
      where: eq(webhooksTable.id, id),
    });

    if (!webhook) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Webhook not found",
      });
    }

    // If it exists but belongs to another user, throw forbidden error
    if (webhook.userId !== ctx.user.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "User is not allowed to access resource",
      });
    }

    return new Webhook(ctx, webhook);
  }

  static async create(
    ctx: AuthedContext,
    input: z.infer<typeof zNewWebhookSchema>,
  ): Promise<Webhook> {
    const [result] = await ctx.db
      .insert(webhooksTable)
      .values({
        url: input.url,
        events: input.events,
        token: input.token ?? null,
        userId: ctx.user.id,
      })
      .returning();

    return new Webhook(ctx, result);
  }

  static async getAll(ctx: AuthedContext): Promise<Webhook[]> {
    const webhooks = await ctx.db.query.webhooksTable.findMany({
      where: eq(webhooksTable.userId, ctx.user.id),
    });

    return webhooks.map((w) => new Webhook(ctx, w));
  }

  ensureCanAccess(ctx: AuthedContext): void {
    if (this.webhook.userId !== ctx.user.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "User is not allowed to access resource",
      });
    }
  }

  async delete(): Promise<void> {
    const res = await this.ctx.db
      .delete(webhooksTable)
      .where(
        and(
          eq(webhooksTable.id, this.webhook.id),
          eq(webhooksTable.userId, this.ctx.user.id),
        ),
      );

    if (res.changes === 0) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }
  }

  async update(input: z.infer<typeof zUpdateWebhookSchema>): Promise<void> {
    const result = await this.ctx.db
      .update(webhooksTable)
      .set({
        url: input.url,
        events: input.events,
        token: input.token,
      })
      .where(
        and(
          eq(webhooksTable.id, this.webhook.id),
          eq(webhooksTable.userId, this.ctx.user.id),
        ),
      )
      .returning();

    if (result.length === 0) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    this.webhook = result[0];
  }

  asPublicWebhook(): z.infer<typeof zWebhookSchema> {
    const { token, ...rest } = this.webhook;
    return {
      ...rest,
      hasToken: token !== null,
    };
  }
}
