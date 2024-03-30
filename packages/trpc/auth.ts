import { randomBytes } from "crypto";
import * as bcrypt from "bcryptjs";

import { db } from "@hoarder/db";
import { apiKeys } from "@hoarder/db/schema";

// API Keys

const BCRYPT_SALT_ROUNDS = 10;
const API_KEY_PREFIX = "ak1";

export async function generateApiKey(name: string, userId: string) {
  const id = randomBytes(10).toString("hex");
  const secret = randomBytes(10).toString("hex");
  const secretHash = await bcrypt.hash(secret, BCRYPT_SALT_ROUNDS);

  const plain = `${API_KEY_PREFIX}_${id}_${secret}`;

  const key = (
    await db
      .insert(apiKeys)
      .values({
        name: name,
        userId: userId,
        keyId: id,
        keyHash: secretHash,
      })
      .returning()
  )[0];

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
  const apiKey = await db.query.apiKeys.findFirst({
    where: (k, { eq }) => eq(k.keyId, keyId),
    with: {
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

export async function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

export async function validatePassword(email: string, password: string) {
  const user = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.email, email),
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.password) {
    throw new Error("This user doesn't have a password defined");
  }

  const validation = await bcrypt.compare(password, user.password);
  if (!validation) {
    throw new Error("Wrong password");
  }

  return user;
}
