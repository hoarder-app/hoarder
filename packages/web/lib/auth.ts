import NextAuth, { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import AuthentikProvider from "next-auth/providers/authentik";
import serverConfig from "@/lib/config";
import prisma from "@remember/db";

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
