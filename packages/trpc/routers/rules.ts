import { experimental_trpcMiddleware, TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import {
  ruleEngineActionsTable,
  ruleEngineRulesTable,
} from "@karakeep/db/schema";
import {
  zNewRuleEngineRuleSchema,
  zRuleEngineActionSchema,
  zRuleEngineConditionSchema,
  zRuleEngineEventSchema,
  zRuleEngineRuleSchema,
  zUpdateRuleEngineRuleSchema,
} from "@karakeep/shared/types/rules";

import { AuthedContext, authedProcedure, router } from "../index";

const ensureRuleOwnership = experimental_trpcMiddleware<{
  ctx: AuthedContext;
  input: { id: string };
}>().create(async (opts) => {
  const rule = await opts.ctx.db.query.ruleEngineRulesTable.findFirst({
    where: eq(ruleEngineRulesTable.id, opts.input.id),
    columns: {
      userId: true,
    },
  });
  if (!rule) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Rule not found",
    });
  }
  if (rule.userId !== opts.ctx.user.id) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "User is not allowed to access this rule",
    });
  }
  return opts.next();
});

export const rulesAppRouter = router({
  create: authedProcedure
    .input(zNewRuleEngineRuleSchema)
    .output(zRuleEngineRuleSchema)
    .mutation(async ({ input, ctx }) => {
      const insertedRule = await ctx.db.transaction(async (tx) => {
        const [newRule] = await tx
          .insert(ruleEngineRulesTable)
          .values({
            name: input.name,
            description: input.description,
            enabled: input.enabled,
            event: JSON.stringify(input.event),
            condition: JSON.stringify(input.condition),
            userId: ctx.user.id,
          })
          .returning();

        if (input.actions.length > 0) {
          await tx.insert(ruleEngineActionsTable).values(
            input.actions.map((action) => ({
              ruleId: newRule.id,
              userId: ctx.user.id,
              action: JSON.stringify(action),
            })),
          );
        }
        return newRule;
      });

      return {
        id: insertedRule.id,
        name: input.name,
        description: input.description,
        enabled: input.enabled,
        event: input.event,
        condition: input.condition,
        actions: input.actions,
      };
    }),
  update: authedProcedure
    .input(zUpdateRuleEngineRuleSchema)
    .output(zRuleEngineRuleSchema)
    .use(ensureRuleOwnership)
    .mutation(async ({ input, ctx }) => {
      await ctx.db.transaction(async (tx) => {
        const result = await tx
          .update(ruleEngineRulesTable)
          .set({
            name: input.name,
            description: input.description,
            enabled: input.enabled,
            event: JSON.stringify(input.event),
            condition: JSON.stringify(input.condition),
          })
          .where(
            and(
              eq(ruleEngineRulesTable.id, input.id),
              eq(ruleEngineRulesTable.userId, ctx.user.id),
            ),
          );

        if (result.changes === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Rule not found",
          });
        }

        if (input.actions.length > 0) {
          await tx
            .delete(ruleEngineActionsTable)
            .where(eq(ruleEngineActionsTable.ruleId, input.id));
          await tx.insert(ruleEngineActionsTable).values(
            input.actions.map((action) => ({
              ruleId: input.id,
              userId: ctx.user.id,
              action: JSON.stringify(action),
            })),
          );
        }
      });

      return input;
    }),
  delete: authedProcedure
    .input(z.object({ id: z.string() }))
    .use(ensureRuleOwnership)
    .mutation(async ({ input, ctx }) => {
      const result = await ctx.db
        .delete(ruleEngineRulesTable)
        .where(
          and(
            eq(ruleEngineRulesTable.id, input.id),
            eq(ruleEngineRulesTable.userId, ctx.user.id),
          ),
        );

      if (result.changes === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Rule not found",
        });
      }
    }),
  list: authedProcedure
    .output(
      z.object({
        rules: z.array(zRuleEngineRuleSchema),
      }),
    )
    .query(async ({ ctx }) => {
      const rules = await ctx.db.query.ruleEngineRulesTable.findMany({
        where: eq(ruleEngineRulesTable.userId, ctx.user.id),
        with: {
          actions: true,
        },
      });

      return {
        rules: rules.map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          enabled: r.enabled,
          event: zRuleEngineEventSchema.parse(JSON.parse(r.event)),
          condition: zRuleEngineConditionSchema.parse(JSON.parse(r.condition)),
          actions: r.actions.map((a) =>
            zRuleEngineActionSchema.parse(JSON.parse(a.action)),
          ),
        })),
      };
    }),
});
