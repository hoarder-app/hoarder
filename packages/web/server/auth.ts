import NextAuth, { NextAuthOptions, getServerSession } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import AuthentikProvider from "next-auth/providers/authentik";
import serverConfig from "@/server/config";
import { prisma } from "@remember/db";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  export interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

const providers = [];

if (serverConfig.auth.authentik) {
  providers.push(AuthentikProvider(serverConfig.auth.authentik));
}

export const authOptions: NextAuthOptions = {
  // Configure one or more authentication providers
  adapter: PrismaAdapter(prisma),
  providers: providers,
  callbacks: {
    session({ session, user }) {
      session.user = { ...user };
      return session;
    },
  },
};

export const authHandler = NextAuth(authOptions);

export const getServerAuthSession = () => getServerSession(authOptions);
