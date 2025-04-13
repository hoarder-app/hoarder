import type { Adapter } from "next-auth/adapters";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { and, count, eq } from "drizzle-orm";
import NextAuth, {
  DefaultSession,
  getServerSession,
  NextAuthOptions,
} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { Provider } from "next-auth/providers/index";
import requestIp from "request-ip";

import { db } from "@karakeep/db";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "@karakeep/db/schema";
import serverConfig from "@karakeep/shared/config";
import { logAuthenticationError, validatePassword } from "@karakeep/trpc/auth";

type UserRole = "admin" | "user";

declare module "next-auth/jwt" {
  export interface JWT {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }
}

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  export interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  export interface DefaultUser {
    role: UserRole | null;
  }
}

/**
 * Returns true if the user table is empty, which indicates that this user is going to be
 * the first one. This can be racy if multiple users are created at the same time, but
 * that should be fine.
 */
async function isFirstUser(): Promise<boolean> {
  const [{ count: userCount }] = await db
    .select({ count: count() })
    .from(users);
  return userCount == 0;
}

/**
 * Returns true if the user is an admin
 */
async function isAdmin(email: string): Promise<boolean> {
  const res = await db.query.users.findFirst({
    columns: { role: true },
    where: eq(users.email, email),
  });
  return res?.role == "admin";
}

const providers: Provider[] = [
  CredentialsProvider({
    // The name to display on the sign in form (e.g. "Sign in with...")
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email", placeholder: "Email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials, req) {
      if (!credentials) {
        return null;
      }

      try {
        return await validatePassword(
          credentials?.email,
          credentials?.password,
        );
      } catch (e) {
        const error = e as Error;
        logAuthenticationError(
          credentials?.email,
          error.message,
          requestIp.getClientIp({ headers: req.headers }),
        );
        return null;
      }
    },
  }),
];

const oauth = serverConfig.auth.oauth;
if (oauth.wellKnownUrl) {
  providers.push({
    id: "custom",
    name: oauth.name,
    type: "oauth",
    wellKnown: oauth.wellKnownUrl,
    authorization: { params: { scope: oauth.scope } },
    clientId: oauth.clientId,
    clientSecret: oauth.clientSecret,
    allowDangerousEmailAccountLinking: oauth.allowDangerousEmailAccountLinking,
    idToken: true,
    checks: ["pkce", "state"],
    httpOptions: {
      timeout: oauth.timeout,
    },
    async profile(profile: Record<string, string>) {
      const [admin, firstUser] = await Promise.all([
        isAdmin(profile.email),
        isFirstUser(),
      ]);
      return {
        id: profile.sub,
        name: profile.name || profile.email,
        email: profile.email,
        image: profile.picture,
        role: admin || firstUser ? "admin" : "user",
      };
    },
  });
}

export const authOptions: NextAuthOptions = {
  // https://github.com/nextauthjs/next-auth/issues/9493
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }) as Adapter,
  providers: providers,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/signin",
    signOut: "/signin",
    error: "/signin",
    newUser: "/signin",
  },
  callbacks: {
    async signIn({ credentials, profile }) {
      if (credentials) {
        return true;
      }
      if (!profile?.email) {
        throw new Error("No profile");
      }
      const [{ count: userCount }] = await db
        .select({ count: count() })
        .from(users)
        .where(and(eq(users.email, profile.email)));

      // If it's a new user and signups are disabled, fail the sign in
      if (userCount === 0 && serverConfig.auth.disableSignups) {
        throw new Error("Signups are disabled in server config");
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role ?? "user",
        };
      }
      return token;
    },
    async session({ session, token }) {
      session.user = { ...token.user };
      return session;
    },
  },
};

export const authHandler = NextAuth(authOptions);

export const getServerAuthSession = () => getServerSession(authOptions);
