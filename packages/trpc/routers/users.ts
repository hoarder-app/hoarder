import { TRPCError } from "@trpc/server";
import { count, eq } from "drizzle-orm";
import invariant from "tiny-invariant";
import { z } from "zod";

import { SqliteError } from "@hoarder/db";
import { users } from "@hoarder/db/schema";
import { deleteUserAssets } from "@hoarder/shared/assetdb";
import serverConfig from "@hoarder/shared/config";
import { zSignUpSchema } from "@hoarder/shared/types/users";

import { hashPassword, validatePassword } from "../auth";
import {
  adminProcedure,
  authedProcedure,
  publicProcedure,
  router,
} from "../index";

export const usersAppRouter = router({
  create: publicProcedure
    .input(zSignUpSchema)
    .output(
      z.object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
        role: z.enum(["user", "admin"]).nullable(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (serverConfig.auth.disableSignups) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Signups are disabled in server config",
        });
      }
      // TODO: This is racy, but that's probably fine.
      const [{ count: userCount }] = await ctx.db
        .select({ count: count() })
        .from(users);
      try {
        const result = await ctx.db
          .insert(users)
          .values({
            name: input.name,
            email: input.email,
            password: await hashPassword(input.password),
            role: userCount == 0 ? "admin" : "user",
          })
          .returning({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
          });
        return result[0];
      } catch (e) {
        if (e instanceof SqliteError) {
          if (e.code == "SQLITE_CONSTRAINT_UNIQUE") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Email is already taken",
            });
          }
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong",
        });
      }
    }),
  list: adminProcedure
    .output(
      z.object({
        users: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            email: z.string(),
            role: z.enum(["user", "admin"]).nullable(),
          }),
        ),
      }),
    )
    .query(async ({ ctx }) => {
      const users = await ctx.db.query.users.findMany({
        columns: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });
      return { users };
    }),
  changePassword: authedProcedure
    .input(
      z.object({
        currentPassword: z.string(),
        newPassword: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      invariant(ctx.user.email, "A user always has an email specified");
      let user;
      try {
        user = await validatePassword(ctx.user.email, input.currentPassword);
      } catch (e) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      invariant(user.id, ctx.user.id);
      await ctx.db
        .update(users)
        .set({
          password: await hashPassword(input.newPassword),
        })
        .where(eq(users.id, ctx.user.id));
    }),
  delete: adminProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const res = await ctx.db.delete(users).where(eq(users.id, input.userId));
      if (res.changes == 0) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      await deleteUserAssets({ userId: input.userId });
    }),
  whoami: authedProcedure
    .output(
      z.object({
        id: z.string(),
        name: z.string().nullish(),
        email: z.string().nullish(),
      }),
    )
    .query(({ ctx }) => {
      return { id: ctx.user.id, name: ctx.user.name, email: ctx.user.email };
    }),
});
