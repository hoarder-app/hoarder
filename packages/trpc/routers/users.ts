import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import invariant from "tiny-invariant";
import { z } from "zod";

import { SqliteError } from "@karakeep/db";
import {
  assets,
  bookmarkLinks,
  bookmarkLists,
  bookmarks,
  bookmarkTags,
  highlights,
  tagsOnBookmarks,
  users,
  userSettings,
} from "@karakeep/db/schema";
import { deleteUserAssets } from "@karakeep/shared/assetdb";
import serverConfig from "@karakeep/shared/config";
import {
  zSignUpSchema,
  zUpdateUserSettingsSchema,
  zUserSettingsSchema,
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

export async function createUserRaw(
  db: Context["db"],
  input: {
    name: string;
    email: string;
    password?: string;
    salt?: string;
    role?: "user" | "admin";
    emailVerified?: Date | null;
  },
) {
  return await db.transaction(async (trx) => {
    let userRole = input.role;
    if (!userRole) {
      const [{ count: userCount }] = await trx
        .select({ count: count() })
        .from(users);
      userRole = userCount == 0 ? "admin" : "user";
    }

    try {
      const [result] = await trx
        .insert(users)
        .values({
          name: input.name,
          email: input.email,
          password: input.password,
          salt: input.salt,
          role: userRole,
          emailVerified: input.emailVerified,
        })
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          emailVerified: users.emailVerified,
        });

      // Insert user settings for the new user
      await trx.insert(userSettings).values({
        userId: result.id,
      });

      return result;
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

export async function createUser(
  input: z.infer<typeof zSignUpSchema>,
  ctx: Context,
  role?: "user" | "admin",
) {
  const salt = generatePasswordSalt();
  return await createUserRaw(ctx.db, {
    name: input.name,
    email: input.email,
    password: await hashPassword(input.password, salt),
    salt,
    role,
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
            bookmarkQuota: z.number().nullable(),
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
          bookmarkQuota: users.bookmarkQuota,
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
      } catch {
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
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

      const [
        [{ numBookmarks }],
        [{ numFavorites }],
        [{ numArchived }],
        [{ numTags }],
        [{ numLists }],
        [{ numHighlights }],
        bookmarksByType,
        topDomains,
        [{ totalAssetSize }],
        assetsByType,
        [{ thisWeek }],
        [{ thisMonth }],
        [{ thisYear }],
        bookmarkingByHour,
        bookmarkingByDay,
        tagUsage,
      ] = await Promise.all([
        // Basic counts
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

        // Bookmarks by type
        ctx.db
          .select({
            type: bookmarks.type,
            count: count(),
          })
          .from(bookmarks)
          .where(eq(bookmarks.userId, ctx.user.id))
          .groupBy(bookmarks.type),

        // Top domains
        ctx.db
          .select({
            domain: sql<string>`CASE 
              WHEN ${bookmarkLinks.url} LIKE 'https://%' THEN 
                CASE 
                  WHEN INSTR(SUBSTR(${bookmarkLinks.url}, 9), '/') > 0 THEN
                    SUBSTR(${bookmarkLinks.url}, 9, INSTR(SUBSTR(${bookmarkLinks.url}, 9), '/') - 1)
                  ELSE
                    SUBSTR(${bookmarkLinks.url}, 9)
                END
              WHEN ${bookmarkLinks.url} LIKE 'http://%' THEN 
                CASE 
                  WHEN INSTR(SUBSTR(${bookmarkLinks.url}, 8), '/') > 0 THEN
                    SUBSTR(${bookmarkLinks.url}, 8, INSTR(SUBSTR(${bookmarkLinks.url}, 8), '/') - 1)
                  ELSE
                    SUBSTR(${bookmarkLinks.url}, 8)
                END
              ELSE 
                CASE 
                  WHEN INSTR(${bookmarkLinks.url}, '/') > 0 THEN
                    SUBSTR(${bookmarkLinks.url}, 1, INSTR(${bookmarkLinks.url}, '/') - 1)
                  ELSE
                    ${bookmarkLinks.url}
                END
            END`,
            count: count(),
          })
          .from(bookmarkLinks)
          .innerJoin(bookmarks, eq(bookmarks.id, bookmarkLinks.id))
          .where(eq(bookmarks.userId, ctx.user.id))
          .groupBy(
            sql`CASE 
            WHEN ${bookmarkLinks.url} LIKE 'https://%' THEN 
              CASE 
                WHEN INSTR(SUBSTR(${bookmarkLinks.url}, 9), '/') > 0 THEN
                  SUBSTR(${bookmarkLinks.url}, 9, INSTR(SUBSTR(${bookmarkLinks.url}, 9), '/') - 1)
                ELSE
                  SUBSTR(${bookmarkLinks.url}, 9)
              END
            WHEN ${bookmarkLinks.url} LIKE 'http://%' THEN 
              CASE 
                WHEN INSTR(SUBSTR(${bookmarkLinks.url}, 8), '/') > 0 THEN
                  SUBSTR(${bookmarkLinks.url}, 8, INSTR(SUBSTR(${bookmarkLinks.url}, 8), '/') - 1)
                ELSE
                  SUBSTR(${bookmarkLinks.url}, 8)
              END
            ELSE 
              CASE 
                WHEN INSTR(${bookmarkLinks.url}, '/') > 0 THEN
                  SUBSTR(${bookmarkLinks.url}, 1, INSTR(${bookmarkLinks.url}, '/') - 1)
                ELSE
                  ${bookmarkLinks.url}
              END
          END`,
          )
          .orderBy(desc(count()))
          .limit(10),

        // Total asset size
        ctx.db
          .select({
            totalAssetSize: sql<number>`COALESCE(SUM(${assets.size}), 0)`,
          })
          .from(assets)
          .where(eq(assets.userId, ctx.user.id)),

        // Assets by type
        ctx.db
          .select({
            type: assets.assetType,
            count: count(),
            totalSize: sql<number>`COALESCE(SUM(${assets.size}), 0)`,
          })
          .from(assets)
          .where(eq(assets.userId, ctx.user.id))
          .groupBy(assets.assetType),

        // Activity stats
        ctx.db
          .select({ thisWeek: count() })
          .from(bookmarks)
          .where(
            and(
              eq(bookmarks.userId, ctx.user.id),
              gte(bookmarks.createdAt, weekAgo),
            ),
          ),
        ctx.db
          .select({ thisMonth: count() })
          .from(bookmarks)
          .where(
            and(
              eq(bookmarks.userId, ctx.user.id),
              gte(bookmarks.createdAt, monthAgo),
            ),
          ),
        ctx.db
          .select({ thisYear: count() })
          .from(bookmarks)
          .where(
            and(
              eq(bookmarks.userId, ctx.user.id),
              gte(bookmarks.createdAt, yearAgo),
            ),
          ),

        // Bookmarking by hour (UTC time)
        ctx.db
          .select({
            hour: sql<number>`CAST(strftime('%H', datetime(${bookmarks.createdAt} / 1000, 'unixepoch')) AS INTEGER)`,
            count: count(),
          })
          .from(bookmarks)
          .where(eq(bookmarks.userId, ctx.user.id))
          .groupBy(
            sql`strftime('%H', datetime(${bookmarks.createdAt} / 1000, 'unixepoch'))`,
          ),

        // Bookmarking by day of week (UTC time)
        ctx.db
          .select({
            day: sql<number>`CAST(strftime('%w', datetime(${bookmarks.createdAt} / 1000, 'unixepoch')) AS INTEGER)`,
            count: count(),
          })
          .from(bookmarks)
          .where(eq(bookmarks.userId, ctx.user.id))
          .groupBy(
            sql`strftime('%w', datetime(${bookmarks.createdAt} / 1000, 'unixepoch'))`,
          ),

        // Tag usage
        ctx.db
          .select({
            name: bookmarkTags.name,
            count: count(),
          })
          .from(bookmarkTags)
          .innerJoin(
            tagsOnBookmarks,
            eq(tagsOnBookmarks.tagId, bookmarkTags.id),
          )
          .where(eq(bookmarkTags.userId, ctx.user.id))
          .groupBy(bookmarkTags.name)
          .orderBy(desc(count()))
          .limit(10),
      ]);

      // Process bookmarks by type
      const bookmarkTypeMap = { link: 0, text: 0, asset: 0 };
      bookmarksByType.forEach((item) => {
        if (item.type in bookmarkTypeMap) {
          bookmarkTypeMap[item.type as keyof typeof bookmarkTypeMap] =
            item.count;
        }
      });

      // Fill missing hours and days with 0
      const hourlyActivity = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        count: bookmarkingByHour.find((item) => item.hour === i)?.count || 0,
      }));

      const dailyActivity = Array.from({ length: 7 }, (_, i) => ({
        day: i,
        count: bookmarkingByDay.find((item) => item.day === i)?.count || 0,
      }));

      return {
        numBookmarks,
        numFavorites,
        numArchived,
        numTags,
        numLists,
        numHighlights,
        bookmarksByType: bookmarkTypeMap,
        topDomains: topDomains.filter((d) => d.domain && d.domain.length > 0),
        totalAssetSize: totalAssetSize || 0,
        assetsByType,
        bookmarkingActivity: {
          thisWeek: thisWeek || 0,
          thisMonth: thisMonth || 0,
          thisYear: thisYear || 0,
          byHour: hourlyActivity,
          byDayOfWeek: dailyActivity,
        },
        tagUsage,
      };
    }),
  settings: authedProcedure
    .output(zUserSettingsSchema)
    .query(async ({ ctx }) => {
      const settings = await ctx.db.query.userSettings.findFirst({
        where: eq(userSettings.userId, ctx.user.id),
      });
      if (!settings) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User settings not found",
        });
      }
      return {
        bookmarkClickAction: settings.bookmarkClickAction,
        archiveDisplayBehaviour: settings.archiveDisplayBehaviour,
      };
    }),
  updateSettings: authedProcedure
    .input(zUpdateUserSettingsSchema)
    .mutation(async ({ input, ctx }) => {
      if (Object.keys(input).length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No settings provided",
        });
      }
      await ctx.db
        .update(userSettings)
        .set({
          bookmarkClickAction: input.bookmarkClickAction,
          archiveDisplayBehaviour: input.archiveDisplayBehaviour,
        })
        .where(eq(userSettings.userId, ctx.user.id));
    }),
});
