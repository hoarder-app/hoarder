import { TRPCError } from "@trpc/server";
import { and, count, eq, isNotNull, not } from "drizzle-orm";
import invariant from "tiny-invariant";
import { z } from "zod";

import { SqliteError } from "@hoarder/db";
import { users } from "@hoarder/db/schema";
import { deleteUserAssets } from "@hoarder/shared/assetdb";
import serverConfig from "@hoarder/shared/config";
import {
  zChangeEmailAddressSchema,
  zSignUpSchema,
} from "@hoarder/shared/types/users";

import { hashPassword, validatePassword } from "../auth";
import {
  adminProcedure,
  authedProcedure,
  Context,
  publicProcedure,
  router,
} from "../index";

export async function createUser(
  input: z.infer<typeof zSignUpSchema>,
  ctx: Context,
  role?: "user" | "admin",
) {
  return ctx.db.transaction(async (trx) => {
    let userRole = role;
    if (!userRole) {
      const [{ count: userCount }] = await trx
        .select({ count: count() })
        .from(users);
      userRole = userCount == 0 ? "admin" : "user";
    }

    try {
      const result = await trx
        .insert(users)
        .values({
          name: input.name,
          email: input.email,
          password: await hashPassword(input.password),
          role: userRole,
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
  });
}

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
      if (
        serverConfig.auth.disableSignups ||
        serverConfig.auth.disablePasswordAuth
      ) {
        const errorMessage = serverConfig.auth.disablePasswordAuth
          ? "Local Signups are disabled in the server config. Use OAuth instead!"
          : "Signups are disabled in server config";
        throw new TRPCError({
          code: "FORBIDDEN",
          message: errorMessage,
        });
      }
      return createUser(input, ctx);
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
            localUser: z.boolean(),
          }),
        ),
      }),
    )
    .query(async ({ ctx }) => {
      const dbUsers = await ctx.db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          password: users.password,
        })
        .from(users);

      return {
        users: dbUsers.map(({ password, ...user }) => ({
          ...user,
          localUser: password !== null,
        })),
      };
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
  changeEmailAddress: authedProcedure
    .input(zChangeEmailAddressSchema)
    .mutation(async ({ input, ctx }) => {
      invariant(ctx.user.email, "A user always has an email specified");

      // verify that the user is actually a local user by checking if it has a password
      const [{ count: usersWithPassword }] = await ctx.db
        .select({ count: count() })
        .from(users)
        .where(and(eq(users.id, ctx.user.id), isNotNull(users.password)));
      if (usersWithPassword < 1) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Updating the email address is not allowed for OAuth users.",
        });
      }
      // verify that no other user has this email address yet
      const [{ count: usersWithEmailAddress }] = await ctx.db
        .select({ count: count() })
        .from(users)
        .where(
          and(
            not(eq(users.id, ctx.user.id)),
            eq(users.email, input.newEmailAddress),
          ),
        );
      if (usersWithEmailAddress != 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Updating the email address is not allowed because it is already in use.",
        });
      }
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
          email: input.newEmailAddress,
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
        localUser: z.boolean(),
      }),
    )
    .query(async ({ ctx }) => {
      if (!ctx.user.email) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      const userDb = await ctx.db.query.users.findFirst({
        where: and(eq(users.id, ctx.user.id), eq(users.email, ctx.user.email)),
      });
      if (!userDb) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return {
        id: ctx.user.id,
        name: ctx.user.name,
        email: ctx.user.email,
        localUser: !!userDb.password,
      };
    }),
});
