import { randomBytes } from "crypto";
import { and, eq } from "drizzle-orm";
import { createTransport } from "nodemailer";

import { db } from "@karakeep/db";
import { verificationTokens } from "@karakeep/db/schema";
import serverConfig from "@karakeep/shared/config";

export async function sendVerificationEmail(email: string, name: string) {
  if (!serverConfig.email.smtp) {
    throw new Error("SMTP is not configured");
  }

  const token = randomBytes(10).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Store verification token
  await db.insert(verificationTokens).values({
    identifier: email,
    token,
    expires,
  });

  const transporter = createTransport({
    host: serverConfig.email.smtp.host,
    port: serverConfig.email.smtp.port,
    secure: serverConfig.email.smtp.secure,
    auth:
      serverConfig.email.smtp.user && serverConfig.email.smtp.password
        ? {
            user: serverConfig.email.smtp.user,
            pass: serverConfig.email.smtp.password,
          }
        : undefined,
  });

  const verificationUrl = `${serverConfig.publicUrl}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

  const mailOptions = {
    from: serverConfig.email.smtp.from,
    to: email,
    subject: "Verify your email address",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Karakeep, ${name}!</h2>
        <p>Please verify your email address by clicking the link below:</p>
        <p>
          <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email Address
          </a>
        </p>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account with us, please ignore this email.</p>
      </div>
    `,
    text: `
Welcome to Karakeep, ${name}!

Please verify your email address by visiting this link:
${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account with us, please ignore this email.
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function verifyEmailToken(
  email: string,
  token: string,
): Promise<boolean> {
  const verificationToken = await db.query.verificationTokens.findFirst({
    where: (vt, { and, eq }) =>
      and(eq(vt.identifier, email), eq(vt.token, token)),
  });

  if (!verificationToken) {
    return false;
  }

  if (verificationToken.expires < new Date()) {
    // Clean up expired token
    await db
      .delete(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, email),
          eq(verificationTokens.token, token),
        ),
      );
    return false;
  }

  // Clean up used token
  await db
    .delete(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, email),
        eq(verificationTokens.token, token),
      ),
    );

  return true;
}
