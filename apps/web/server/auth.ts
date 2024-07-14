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

import { db } from "@hoarder/db";
import { users } from "@hoarder/db/schema";
import serverConfig from "@hoarder/shared/config";
import { validatePassword } from "@hoarder/trpc/auth";

declare module "next-auth/jwt" {
  export interface JWT {
    user: {
      id: string;
      role: "admin" | "user";
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
      role: "admin" | "user";
    } & DefaultSession["user"];
  }

  export interface DefaultUser {
    role: "admin" | "user" | null;
  }
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
        role: "user",
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
