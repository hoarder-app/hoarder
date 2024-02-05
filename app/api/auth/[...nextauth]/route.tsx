import NextAuth from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import AuthentikProvider from "next-auth/providers/authentik";
import { PrismaClient } from "@prisma/client"
import serverConfig from "@/lib/config";

const prisma = new PrismaClient()

let providers = [];

if (serverConfig.auth.authentik) {
  providers.push(AuthentikProvider(serverConfig.auth.authentik));
}

const handler = NextAuth({
  // Configure one or more authentication providers
  adapter: PrismaAdapter(prisma),
  providers: providers,
});

export { handler as GET, handler as POST }
