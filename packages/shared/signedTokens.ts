import crypto from "node:crypto";
import { z } from "zod";

import serverConfig from "./config";

const zTokenPayload = z.object({
  payload: z.unknown(),
  expiresAt: z.number(),
});

const zSignedTokenPayload = z.object({
  payload: zTokenPayload,
  signature: z.string(),
});

export type SignedTokenPayload = z.infer<typeof zSignedTokenPayload>;

export function createSignedToken(
  payload: unknown,
  expiryEpoch?: number,
): string {
  const expiresAt = expiryEpoch ?? Date.now() + 5 * 60 * 1000; // 5 minutes from now

  const toBeSigned: z.infer<typeof zTokenPayload> = {
    payload,
    expiresAt,
  };

  const payloadString = JSON.stringify(toBeSigned);
  const signature = crypto
    .createHmac("sha256", serverConfig.signingSecret())
    .update(payloadString)
    .digest("hex");

  const tokenData: z.infer<typeof zSignedTokenPayload> = {
    payload: toBeSigned,
    signature,
  };

  return Buffer.from(JSON.stringify(tokenData)).toString("base64");
}

export function verifySignedToken<T>(
  token: string,
  schema: z.ZodSchema<T>,
): T | null {
  try {
    const tokenData = zSignedTokenPayload.parse(
      JSON.parse(Buffer.from(token, "base64").toString()),
    );
    const { payload, signature } = tokenData;

    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", serverConfig.signingSecret())
      .update(JSON.stringify(payload))
      .digest("hex");

    if (signature !== expectedSignature) {
      return null;
    }
    // Check expiry
    if (Date.now() > payload.expiresAt) {
      return null;
    }

    return schema.parse(payload.payload);
  } catch {
    return null;
  }
}
