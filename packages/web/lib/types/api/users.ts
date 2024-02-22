import { z } from "zod";

export const zSignUpSchema = z
  .object({
    name: z.string().min(1, { message: "Name can't be empty" }),
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
