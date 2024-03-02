import { zSignUpSchema } from "@/lib/types/api/users";
import { adminProcedure, publicProcedure, router } from "../trpc";
import { SqliteError } from "@hoarder/db";
import { z } from "zod";
import { hashPassword } from "@/server/auth";
import { TRPCError } from "@trpc/server";
import { users } from "@hoarder/db/schema";
import { count, eq } from "drizzle-orm";

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
    }),
});
