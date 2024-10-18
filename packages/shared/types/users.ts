import { z } from "zod";

const PASSWORD_MAX_LENGTH = 100;

export const zSignUpSchema = z
  .object({
    name: z.string().min(1, { message: "Name can't be empty" }),
    email: z.string().email(),
    password: z.string().min(8).max(PASSWORD_MAX_LENGTH),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const zRoleSchema = z.object({
  role: z.enum(["user", "admin"]),
  adminPassword: z.string(),
});

export const zAdminCreateUserSchema = zSignUpSchema.and(zRoleSchema);

export const changeRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(["user", "admin"]),
  adminPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export const resetPasswordSchema = z
  .object({
    userId: z.string(),
    newPassword: z.string().min(8).max(PASSWORD_MAX_LENGTH),
    newPasswordConfirm: z.string(),
    adminPassword: z.string().min(8, "Password must be at least 8 characters"),
  })
  .refine((data) => data.newPassword === data.newPasswordConfirm, {
    message: "Passwords don't match",
    path: ["newPasswordConfirm"],
  });

export const zChangePasswordSchema = z
  .object({
    currentPassword: z.string(),
    newPassword: z.string().min(8).max(PASSWORD_MAX_LENGTH),
    newPasswordConfirm: z.string(),
  })
  .refine((data) => data.newPassword === data.newPasswordConfirm, {
    message: "Passwords don't match",
    path: ["newPasswordConfirm"],
  });
