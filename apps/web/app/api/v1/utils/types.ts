import { z } from "zod";

export const zStringBool = z
  .string()
  .refine((val) => val === "true" || val === "false", "Must be true or false")
  .transform((val) => val === "true");
