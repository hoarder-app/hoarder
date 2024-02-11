import { TRPCError, initTRPC } from "@trpc/server";
import { Session } from "next-auth";

export type Context = {
  session: Session | null;
};

// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.context<Context>().create();
export const createCallerFactory = t.createCallerFactory;
// Base router and procedure helpers
export const router = t.router;
export const procedure = t.procedure;
export const publicProcedure = t.procedure;

export const authedProcedure = t.procedure.use(function isAuthed(opts) {
  const user = opts.ctx.session?.user;

  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return opts.next({
    ctx: {
      user,
    },
  });
});
