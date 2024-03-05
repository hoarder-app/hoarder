import { db } from "@hoarder/db";
import serverConfig from "@hoarder/shared/config";
import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";

type User = {
  id: string;
  name?: string | null | undefined;
  email?: string | null | undefined;
  role: "admin" | "user" | null;
};

export type Context = {
  user: User | null;
  db: typeof db;
};

// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.context<Context>().create({
  transformer: superjson,
});
export const createCallerFactory = t.createCallerFactory;
// Base router and procedure helpers
export const router = t.router;
export const procedure = t.procedure.use(function isDemoMode(opts) {
  if (serverConfig.demoMode && opts.type == "mutation") {
    throw new TRPCError({
      message: "Mutations are not allowed in demo mode",
      code: "FORBIDDEN",
    });
  }
  return opts.next();
});
export const publicProcedure = procedure;

export const authedProcedure = procedure.use(function isAuthed(opts) {
  const user = opts.ctx.user;

  if (!user || !user.id) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return opts.next({
    ctx: {
      user,
    },
  });
});

export const adminProcedure = authedProcedure.use(function isAdmin(opts) {
  const user = opts.ctx.user;
  if (user.role != "admin") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return opts.next(opts);
});
