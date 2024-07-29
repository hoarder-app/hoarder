import type { Adapter, AdapterUser } from "next-auth/adapters";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { and, count, eq } from "drizzle-orm";
import NextAuth, {
  Account,
  DefaultSession,
  getServerSession,
  NextAuthOptions,
  User,
} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { Provider } from "next-auth/providers/index";

import { db } from "@hoarder/db";
import { users } from "@hoarder/db/schema";
import serverConfig from "@hoarder/shared/config";
import { validatePassword } from "@hoarder/trpc/auth";

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
 * OAuth does not provide role information, so we have to read the role from the database, when OAuth is used
 * @param userId the id of the user to find the roles for
 */
async function getRoleForOAuthUser(userId: string) {
  const result = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId));

  // User already exists-->take what is written in the DB
  if (result && result.length) {
    return result[0].role;
  }

  return null;
}

/**
 * If a new user is created based on OAuth credentials, we need to promote the first user to admin, so we have at least 1 admin
 */
async function updateRoleForOAuthUser() {
  let role: UserRole = "user";

  // If there is not a single user yet, we just assign the admin permissions, to have at least 1 admin
  // Perform in a transaction to prevent 2 users getting promoted to admin if 2 users sign up at the same time
  return db.transaction(async () => {
    const [{ count: userCount }] = await db
      .select({ count: count() })
      .from(users);
    if (userCount === 1) {
      role = "admin";

      // Only 1 user exists --> update the role to admin
      await db.update(users).set({ role: "admin" });
    }
    return role;
  });
}

/**
 * Gets the assigned role for a user
 * @param user the user object
 * @param account information about where that account is coming from (oauth or not)
 * @param isNewUser if this is a new user or not
 */
async function getUserRole(
  user: User | AdapterUser,
  account: Account | null,
  isNewUser: boolean | undefined,
) {
  let role = user.role;
  if (account && account.type === "oauth") {
    if (isNewUser) {
      role = await updateRoleForOAuthUser();
    } else {
      role = await getRoleForOAuthUser(user.id);
    }
  }
  return role;
}

const providers: Provider[] = [
  CredentialsProvider({
    // The name to display on the sign in form (e.g. "Sign in with...")
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email", placeholder: "Email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials) {
        return null;
      }

      try {
        return await validatePassword(
          credentials?.email,
          credentials?.password,
        );
      } catch (e) {
        return null;
      }
    },
  }),
];

const oauth = serverConfig.auth.oauth;
if (oauth.clientId && oauth.clientSecret && oauth.wellKnownUrl) {
  providers.push({
    id: "custom",
    name: oauth.name,
    type: "oauth",
    wellKnown: oauth.wellKnownUrl,
    authorization: { params: { scope: "openid email profile" } },
    clientId: oauth.clientId,
    clientSecret: oauth.clientSecret,
    allowDangerousEmailAccountLinking: oauth.allowDangerousEmailAccountLinking,
    idToken: true,
    checks: ["pkce", "state"],
    profile(profile: Record<string, string>) {
      return {
        id: profile.sub,
        name: profile.name,
        email: profile.email,
        image: profile.picture,
        role: "user", //will be updated correctly at a later point, when it is already in the database
      };
    },
  });
}

export const authOptions: NextAuthOptions = {
  // https://github.com/nextauthjs/next-auth/issues/9493
  adapter: DrizzleAdapter(db) as Adapter,
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
    async signIn({ account, profile }) {
      if (account?.type === "credentials") {
        return true;
      }
      if (!profile?.email || !profile?.name) {
        throw new Error("No profile");
      }
      const [{ count: userCount }] = await db
        .select({ count: count() })
        .from(users)
        .where(and(eq(users.email, profile.email)));
      if (userCount === 1) {
        // Users can change their name-->update the name in our users table as well
        await db
          .update(users)
          .set({ name: profile.name })
          .where(eq(users.email, profile.email));
        // User used OAuth before to sign in
        return true;
      }
      // User did not exist before --> check if signups are enabled
      if (serverConfig.auth.disableSignups) {
        throw new Error("Signups are disabled in server config");
      }
      return true;
    },
    async jwt({ token, user, isNewUser, account }) {
      if (user) {
        const role = await getUserRole(user, account, isNewUser);
        token.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: role ?? "user",
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
