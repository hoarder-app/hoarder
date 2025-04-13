import { z } from "zod";

export const zStringBool = z
  .string()
  .refine((val) => val === "true" || val === "false", "Must be true or false")
  .transform((val) => val === "true");

export const zGetBookmarkSearchParamsSchema = z.object({
  // TODO: Change the default to false in a couple of releases.
  includeContent: zStringBool.optional().default("true"),
});
