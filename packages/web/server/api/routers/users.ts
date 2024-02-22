import { zSignUpSchema } from "@/lib/types/api/users";
import { publicProcedure, router } from "../trpc";
import { Prisma, prisma } from "@hoarder/db";
import { z } from "zod";
import { hashPassword } from "@/server/auth";
import { TRPCError } from "@trpc/server";

export const usersAppRouter = router({
  create: publicProcedure
    .input(zSignUpSchema)
    .output(
      z.object({
        name: z.string(),
        email: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        return await prisma.user.create({
          data: {
            name: input.name,
            email: input.email,
            password: await hashPassword(input.password),
          },
          select: {
            name: true,
            email: true,
          },
        });
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
          if (e.code === "P2002") {
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
});
