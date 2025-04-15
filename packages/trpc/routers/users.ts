import { TRPCError } from "@trpc/server";
import { and, count, eq } from "drizzle-orm";
import invariant from "tiny-invariant";
import { z } from "zod";

import { SqliteError } from "@karakeep/db";
import {
  bookmarkLists,
  bookmarks,
  bookmarkTags,
  highlights,
  users,
} from "@karakeep/db/schema";
import { deleteUserAssets } from "@karakeep/shared/assetdb";
import serverConfig from "@karakeep/shared/config";
import {
  zSignUpSchema,
  zUserStatsResponseSchema,
  zWhoAmIResponseSchema,
} from "@karakeep/shared/types/users";

import { generatePasswordSalt, hashPassword, validatePassword } from "../auth";
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

    const salt = generatePasswordSalt();
    try {
      const result = await trx
        .insert(users)
        .values({
          name: input.name,
          email: input.email,
          password: await hashPassword(input.password, salt),
          salt,
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
      const newSalt = generatePasswordSalt();
      await ctx.db
        .update(users)
        .set({
          password: await hashPassword(input.newPassword, newSalt),
          salt: newSalt,
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
    .output(zWhoAmIResponseSchema)
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
      return { id: ctx.user.id, name: ctx.user.name, email: ctx.user.email };
    }),
  stats: authedProcedure
    .output(zUserStatsResponseSchema)
    .query(async ({ ctx }) => {
      const [
        [{ numBookmarks }],
        [{ numFavorites }],
        [{ numArchived }],
        [{ numTags }],
        [{ numLists }],
        [{ numHighlights }],
      ] = await Promise.all([
        ctx.db
          .select({ numBookmarks: count() })
          .from(bookmarks)
          .where(eq(bookmarks.userId, ctx.user.id)),
        ctx.db
          .select({ numFavorites: count() })
          .from(bookmarks)
          .where(
            and(
              eq(bookmarks.userId, ctx.user.id),
              eq(bookmarks.favourited, true),
            ),
          ),
        ctx.db
          .select({ numArchived: count() })
          .from(bookmarks)
          .where(
            and(
              eq(bookmarks.userId, ctx.user.id),
              eq(bookmarks.archived, true),
            ),
          ),
        ctx.db
          .select({ numTags: count() })
          .from(bookmarkTags)
          .where(eq(bookmarkTags.userId, ctx.user.id)),
        ctx.db
          .select({ numLists: count() })
          .from(bookmarkLists)
          .where(eq(bookmarkLists.userId, ctx.user.id)),
        ctx.db
          .select({ numHighlights: count() })
          .from(highlights)
          .where(eq(highlights.userId, ctx.user.id)),
      ]);
      return {
        numBookmarks,
        numFavorites,
        numArchived,
        numTags,
        numLists,
        numHighlights,
      };
    }),
});
