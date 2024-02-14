import NextAuth, { NextAuthOptions, getServerSession } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import AuthentikProvider from "next-auth/providers/authentik";
import serverConfig from "@remember/shared/config";
import { prisma } from "@remember/db";
import { DefaultSession } from "next-auth";
import * as bcrypt from "bcrypt";

import { randomBytes } from "crypto";

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

// API Keys

const BCRYPT_SALT_ROUNDS = 10;
const API_KEY_PREFIX = "ak1";

export async function generateApiKey(name: string, userId: string) {
  const id = randomBytes(10).toString("hex");
  const secret = randomBytes(10).toString("hex");
  const secretHash = await bcrypt.hash(secret, BCRYPT_SALT_ROUNDS);

  const plain = `${API_KEY_PREFIX}_${id}_${secret}`;

  const key = await prisma.apiKey.create({
    data: {
      name: name,
      userId: userId,
      keyId: id,
      keyHash: secretHash,
    },
  });

  return {
    id: key.id,
    name: key.name,
    createdAt: key.createdAt,
    key: plain,
  };
}

function parseApiKey(plain: string) {
  const parts = plain.split("_");
  if (parts.length != 3) {
    throw new Error(
      `Malformd API key. API keys should have 3 segments, found ${parts.length} instead.`,
    );
  }
  if (parts[0] !== API_KEY_PREFIX) {
    throw new Error(`Malformd API key. Got unexpected key prefix.`);
  }
  return {
    keyId: parts[1],
    keySecret: parts[2],
  };
}

export async function authenticateApiKey(key: string) {
  const { keyId, keySecret } = parseApiKey(key);
  const apiKey = await prisma.apiKey.findUnique({
    where: {
      keyId,
    },
    include: {
      user: true,
    },
  });

  if (!apiKey) {
    throw new Error("API key not found");
  }

  const hash = apiKey.keyHash;

  const validation = await bcrypt.compare(keySecret, hash);
  if (!validation) {
    throw new Error("Invalid API Key");
  }

  return apiKey.user;
}
